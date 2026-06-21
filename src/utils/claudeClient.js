// BYOK Claude client. The user supplies their own Anthropic API key, kept only
// in their browser. Every request is built from an ALREADY-SANITISED profile and
// re-checked by `assertNoRawAmounts` before it is sent.

import Anthropic from '@anthropic-ai/sdk'
import { assertNoRawAmounts } from './sanitiser.js'
import { buildRulesContext, selectRelevantSections, collectSources } from '../data/cpfRules.js'

// Swappable model constant. Haiku is fast/cheap and ample for Q&A over a fixed KB.
export const MODEL = 'claude-haiku-4-5'
export const MAX_TOKENS = 1024

const SYSTEM_PROMPT = `You are a CPF (Singapore Central Provident Fund) planning assistant.

You receive the user's financial position ONLY as anonymised RANGES (bands), never exact dollar amounts, plus a structured CPF rules knowledge base. This is a deliberate privacy design.

Rules for your answers:
- Reason and answer in terms of the bands you are given. NEVER ask the user for their exact balances or income — you cannot receive them and should not request them.
- Ground your answers in the provided CPF knowledge base. If something isn't covered, say so rather than inventing figures.
- When a question needs arithmetic (gaps to a retirement sum, contribution amounts, multi-year growth), work it out yourself step by step and show the key figures so the reasoning is transparent. Because you only know the user's balances as ranges, compute with the band's midpoint (or its lower/upper edge) and SAY which you used — give the answer as a range or an approximation, not a false-precision exact figure. Keep the arithmetic simple; round sensibly.
- Be concise, concrete and practical. Use Singapore dollar context. Format answers in Markdown (short paragraphs, bullet lists where helpful).
- Do NOT include any URLs or links in your answer. The app displays a verified list of official CPF source links separately, so you never need to write one — and any link you write would be unreliable. Refer to sources by name if useful (e.g. "the CPF guide on housing grants"), not by URL.
- End every answer with a one-line disclaimer: "This is general information, not financial advice — verify against cpf.gov.sg."`

export function createClient(apiKey) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

// Build the user-facing content block from sanitised data only. Returns the
// full content AND the `profileBlock` in isolation — the latter is the only
// text we derive from the user's raw numbers, so it's what the leak guard
// inspects. (The knowledge base holds public dollar figures that may coincide
// with a user's balance and must NOT be guarded against.)
function buildUserContent({ sanitisedProfile, rulesContext, question }) {
  const profileBlock = [
    'My CPF position (anonymised ranges):',
    `- Ordinary Account: ${sanitisedProfile.oaBand}`,
    `- Special Account: ${sanitisedProfile.saBand}`,
    `- MediSave Account: ${sanitisedProfile.maBand}`,
    `- Total CPF: ${sanitisedProfile.totalBand}`,
    sanitisedProfile.incomeBand ? `- Monthly income: ${sanitisedProfile.incomeBand}` : null,
    sanitisedProfile.age != null ? `- Age: ${sanitisedProfile.age}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const content = `${profileBlock}\n\n${rulesContext}\n\nQuestion: ${question}`
  return { content, profileBlock }
}

// Ask a CPF question. `rawProfile` is passed ONLY to the leak guard so we can
// assert no exact figure slipped into the outgoing request.
export async function askCPF({ apiKey, sanitisedProfile, rawProfile, question, history = [] }) {
  if (!apiKey) throw new Error('Missing Anthropic API key.')

  const selection = selectRelevantSections(question)
  const rulesContext = buildRulesContext(selection)
  const { content: userContent, profileBlock } = buildUserContent({
    sanitisedProfile,
    rulesContext,
    question,
  })

  // Privacy gate: the profile block is the ONLY text we generate from the user's
  // raw numbers. Verify our sanitisation emitted no exact amount. We deliberately
  // do not scan the public knowledge base — its dollar figures may legitimately
  // match a user's balance and would otherwise cause false-positive aborts.
  assertNoRawAmounts(profileBlock, rawProfile)

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userContent },
  ]

  const client = createClient(apiKey)
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages,
  })

  const text = resp.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')

  // Verified official citations for exactly the KB entries used — attached by
  // the app, never written by the model, so every link is real.
  const sources = collectSources(selection)

  // Return the answer, citations, and exactly what was sent (transparency panel).
  return { text, sources, sentPayload: { system: SYSTEM_PROMPT, messages, model: MODEL } }
}
