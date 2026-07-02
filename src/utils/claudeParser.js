// Claude-powered PDF parsing agent.
//
// The user uploads a CPF statement PDF; we send it to Claude (BYOK, from the
// browser) and ask it to extract the figures that matter for CPF budgeting into
// a strict JSON schema. This replaces the earlier in-browser pdf.js parser.
//
// PRIVACY NOTE: unlike the chat path (which only ever sees anonymised bands),
// this step sends the RAW statement PDF to Anthropic so the model can read it.
// That is a deliberate, disclosed trade-off for accurate long-form extraction.
// The extracted figures are still sanitised into bands by `sanitiseDocument`
// before they are attached to any chat request.

import { createClient } from './claudeClient.js'

// Extraction model. Opus is the most capable at reading varied/long documents;
// swap to 'claude-haiku-4-5' (also supports PDF + structured outputs) if you want
// a cheaper, faster parse at some accuracy cost.
export const PARSE_MODEL = 'claude-opus-4-8'
export const PARSE_MAX_TOKENS = 2048

// Strict JSON schema for the extracted statement. Structured outputs require
// `additionalProperties: false` and explicit `required`; nullable fields use an
// anyOf null union so the model can signal "not found".
const nullableNumber = { anyOf: [{ type: 'number' }, { type: 'null' }] }
const EXTRACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    accounts: {
      type: 'object',
      additionalProperties: false,
      properties: {
        oa: nullableNumber,
        sa: nullableNumber,
        ma: nullableNumber,
        ra: nullableNumber,
      },
      required: ['oa', 'sa', 'ma', 'ra'],
    },
    totalBalance: nullableNumber,
    income: nullableNumber,
    age: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    statementDate: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    contributions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          date: { type: 'string' },
          amount: { type: 'number' },
        },
        required: ['date', 'amount'],
      },
    },
    confidence: { type: 'string', enum: ['high', 'partial', 'none'] },
    warnings: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'accounts',
    'totalBalance',
    'income',
    'age',
    'statementDate',
    'contributions',
    'confidence',
    'warnings',
  ],
}

const SYSTEM_PROMPT = `You are a parsing agent that extracts CPF (Singapore Central Provident Fund) figures from an uploaded statement PDF.

Extract only what the document actually contains — never guess or invent figures. Rules:
- Return account balances as plain numbers in SGD (e.g. 82000.50), not strings. Use null for any figure the document does not show.
- accounts.oa/sa/ma/ra are the Ordinary, Special, MediSave and Retirement account balances.
- totalBalance is the statement's stated total; if none is printed, sum the accounts you found.
- income is a monthly wage/salary figure if present, else null.
- age is the member's age if stated, else null. statementDate is the statement/"as at" date as printed (else null).
- contributions is a list of recent contribution entries with a date (as printed) and a numeric amount.
- confidence: "high" if you found the core OA/SA/MA balances, "partial" if some are missing, "none" if this does not look like a CPF statement.
- warnings: short notes about anything you could not read or that looked ambiguous.`

// Convert an ArrayBuffer to a newline-free base64 string (required by the API).
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

// Coerce a value to a finite number or null (defends against string figures).
function num(v) {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// Normalise the model's JSON into the `document` shape the UI + sanitiser expect.
function normaliseDocument(raw) {
  const accounts = raw.accounts ?? {}
  const oa = num(accounts.oa)
  const sa = num(accounts.sa)
  const ma = num(accounts.ma)
  const ra = num(accounts.ra)
  const contributions = Array.isArray(raw.contributions)
    ? raw.contributions
        .map((c) => ({ date: String(c?.date ?? ''), amount: num(c?.amount) }))
        .filter((c) => c.amount != null)
    : []
  const computedTotal = [oa, sa, ma, ra].reduce((s, v) => (v != null ? s + v : s), 0)
  return {
    accounts: { oa, sa, ma, ra },
    totalBalance: num(raw.totalBalance) ?? (computedTotal > 0 ? computedTotal : null),
    income: num(raw.income),
    age: raw.age == null ? null : num(raw.age),
    statementDate: raw.statementDate ? String(raw.statementDate) : null,
    contributions,
    contributionCount: contributions.length,
    confidence: ['high', 'partial', 'none'].includes(raw.confidence) ? raw.confidence : 'none',
    warnings: Array.isArray(raw.warnings) ? raw.warnings.map(String) : [],
  }
}

// Parse a CPF statement PDF with Claude. Returns { document, meta }.
export async function parseCpfPdf(file, apiKey) {
  if (!apiKey) throw new Error('Add your Anthropic API key (in the assistant panel) to parse a PDF.')
  if (!file) throw new Error('No file provided.')

  const base64 = arrayBufferToBase64(await file.arrayBuffer())
  const client = createClient(apiKey)

  const resp = await client.messages.create({
    model: PARSE_MODEL,
    max_tokens: PARSE_MAX_TOKENS,
    system: SYSTEM_PROMPT,
    // Structured outputs: constrain the reply to our schema so it parses cleanly.
    output_config: { format: { type: 'json_schema', schema: EXTRACTION_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          },
          { type: 'text', text: 'Extract the CPF figures from this statement into the required JSON.' },
        ],
      },
    ],
  })

  if (resp.stop_reason === 'refusal') {
    throw new Error('The model declined to process this document.')
  }

  const text = resp.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()

  let raw
  try {
    // Tolerate an accidental ```json fence around the payload.
    raw = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''))
  } catch {
    throw new Error('Could not read a structured result from the document.')
  }

  const document = normaliseDocument(raw)
  return { document, meta: { model: PARSE_MODEL, fileName: file?.name ?? null } }
}
