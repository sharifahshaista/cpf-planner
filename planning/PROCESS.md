## Details of the project

This is a zero-retention CPF budget planner built in React + Vite. It lets 
users enter their CPF account balances (OA, SA, MA) and ask 
natural-language questions about retirement planning, withdrawal eligibility, 
and savings projections — all powered by Claude.

The core design constraint is privacy. Personal financial data (balances, 
transaction history) never leaves the browser in raw form. A sanitiser layer 
converts exact dollar amounts into labelled ranges before any API call is made, 
so the LLM only ever receives anonymised context alongside a structured CPF 
rules knowledge base.

Target user: Singapore residents who want to reason about their CPF without 
uploading sensitive documents to a third-party service.

As a fresh graduate, this seems like a personal local tool I would utilise when doing budget planning.

---

## AI tools used

- Claude Code — primary coding agent, used throughout the build for 
  scaffolding, implementation, and debugging (Opus 4.8)
- Claude claude.ai (claude.ai) — used for architecture planning, prompt 
  design, and reviewing the CPF rules knowledge base for accuracy
- Claude API (claude-haiku-4-5) — powers the in-app Q&A interface at runtime

---

## How the agent helped

*Planning*
Claude helped me plan and define the three-layer tech architecture (knowledge base → sanitiser 
→ LLM interface) before writing any code. It also helped me identify the key 
risk early: that naive implementations of personal finance AI tend to send raw 
identifiable data to public APIs. Designing around this constraint shaped every 
subsequent decision.

*Implementation*
Claude Code generated the initial CPF rules knowledge base (`cpfRules.js`) from 
a structured prompt specifying 2025 values — interest rates, BRS/FRS/ERS, 
contribution rates by age group, and withdrawal rules. This would have taken 
significant manual research time to compile accurately.

For the sanitiser (`sanitiser.js`), I prompted Claude Code with the explicit 
privacy requirement and reviewed its output to verify that exact figures were 
being replaced with ranges rather than simply rounded.

*Debugging*
* The privacy guard that checks users' queries to verify no raw dollar amounts leak through
was throwing false errors and aborting legitimate queries related to buying a BTO. 
* Root cause: The guard was scanning the entire outgoing payload, including the public CPF 
knowledge base, rather than just the user-derived content. The knowledge base 
legitimately contains policy figures like $7,000, $14,000, and $120,000 — 
official CPF grant and retirement sum values. If a user's actual balance 
happened to equal any of these public figures, the guard would find the number 
in the knowledge base, misidentify it as a leaked personal balance, and abort 
the request.
* Some numerical figures in the knowledge base were not precise. Identified and corrected 
inaccurate figures in `cpfRules.js` that had been generated during the initial scaffold.
* Illegitimate website URLs presented in generated responses as references. 

## Iteration history (fixes & refinements)

1. **Initial build** — sanitiser, KB, BYOK Claude chat, local projection panel,
   privacy guard, transparency panel; Vitest tests for the sanitiser.
2. **KB expansion to life events** — researched CPF educational resources and added
   the seven life-stage categories with sourced facts; redesigned the UI to a clean,
   editorial light theme (serif headings, line-art icons, life-stage explorer) with
   richer charts.
3. **BTO scheme** — added a "Buying a BTO flat" life event scoped to where **CPF is
   usable as payment**: income ceilings (grant gating), Enhanced CPF Housing Grant
   eligibility, downpayment payable from OA (HDB vs bank loan), Staggered Downpayment
   Scheme, OA-paid instalments.
4. **Calculator tool — added then I removed** — Remembered that the model since ranges
    instead of exact dollar values so I removed it. Computation is now handled by the model 
    reasoning in **band midpoints** and stating which approximation it used (honest, since it never holds exact
   figures).
5. **Chat UX** — "New chat" / clear-session control; proper **Markdown rendering**
   of replies (`react-markdown` + `remark-gfm`); a collapsible **glossary** card.
6. **Privacy-guard false positive** — the guard had scanned the entire payload,
   including the public KB, so a user balance equal to a public CPF figure (e.g.
   $7,000) wrongly aborted the request. Fixed by scoping the guard to the sanitised
   profile block only.
7. **Legitimate citations** — links the model emitted were broken or hallucinated,
   and several KB URLs were stale/non-official. Fixed by: curating `SOURCES` to
   **verified official-only** URLs (each WebFetch-checked for HTTP 200), removing
   URLs from the model's context and forbidding it from writing links, and instead
   having the **app attach citations deterministically** via `collectSources()` —
   rendered as an "Official sources" list under each answer. A test asserts every
   source is HTTPS on an official domain (`cpf.gov.sg`/`hdb.gov.sg`/`moh.gov.sg`).

---

## Features built

- Manual OA / SA / MA balance input with validation
- CPF rules knowledge base covering 2025 interest rates, retirement sums, 
  contribution rates, and withdrawal eligibility
- Sanitiser layer that anonymises balances before Claude API calls
- Natural-language Q&A interface powered by Claude, grounded in the rules 
  knowledge base
- Basic retirement projection panel (years to FRS, projected OA/SA growth)

---

## What I cut or simplified

*PDF parsing* — the most complete version of this tool would parse a CPF 
statement PDF locally and extract balances automatically. The CPF website offers annual statement
or last 15-month statement. PDF parsing tool was cut because it added 
significant complexity (PDF parsing libraries, local file handling) without 
meaningfully demonstrating the core architecture.

*Live CPF API integration*— CPF Board does not offer a public API for 
individual account data. Relying on some articles on 2026 rates for this build.

*Vector database / semantic search* — a production version might embed CPF 
policy documents and retrieve relevant chunks per query. Replaced with a 
hardcoded structured knowledge base, which is sufficient for well-scoped 
planning queries and easier to audit for accuracy.

*User authentication and persistent storage* — deliberately excluded. 
Storing CPF data server-side introduces the exact privacy risks this 
architecture is designed to avoid. A future version might explore local 
encrypted storage.

---

## Weakest part and what I would improve next

**Weakest part:** The CPF rules knowledge base is hardcoded and will go stale. 
CPF interest rates and retirement sum values are updated periodically, and there 
is currently no mechanism to detect or reflect those live, abrupt changes. A user relying on 
outdated figures could make poor planning decisions.

---

## Architecture

```
BalanceInput ─┐                    (raw numbers stay in React state only)
              ├─► profile {oa,sa,ma,age,income} ─► projection.js (local math) ─► ProjectionPanel
              │                                                  (charts, milestones — no LLM)
              ├─► LifeEvents ── ask(question) ──► ChatInterface
              └─► ChatInterface
                      │ on send
                      ▼
                 sanitiser.js  (amounts → bands)  +  cpfRules.js (KB)
                      │
                      ▼  anonymised payload only
                 claudeClient.js (BYOK, dangerouslyAllowBrowser)
                      │
                      ▼
                 Claude (claude-haiku-4-5) ─► answer + app-attached official sources
```


## Project layout

```
src/
  data/cpfRules.js        # knowledge base: SOURCES, cpfRules, LIFE_EVENTS, GLOSSARY,
                          # buildRulesContext, selectRelevantSections, collectSources
  utils/
    sanitiser.js          # toBand, sanitiseProfile, assertNoRawAmounts (+ tests)
    projection.js         # local compound-interest projection
    claudeClient.js       # BYOK Claude wrapper, system prompt, askCPF
  components/
    BalanceInput.jsx      # OA/SA/MA/age/income form
    ProjectionPanel.jsx   # charts + milestones (local, no network)
    LifeEvents.jsx        # life-stage explorer; hands questions to the chat
    ChatInterface.jsx     # chat, key entry, markdown, sources, transparency
    Glossary.jsx          # CPF abbreviations
    icons.jsx             # line-art icon set
  App.jsx, App.css, index.css
```

