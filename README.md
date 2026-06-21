# CPF Planner

A **zero-retention CPF budget planner** built with React + Vite. Singapore
residents enter their CPF account balances (Ordinary, Special, MediSave) and ask
natural-language questions about retirement planning, withdrawal eligibility,
housing, healthcare, and savings projections — answered by Claude, grounded in a
structured CPF rules knowledge base.

The defining constraint is **privacy**: personal financial data never leaves the
browser in raw form. A sanitiser layer converts exact dollar amounts into labelled
ranges (e.g. `$100k–$150k`) before any API call, so the model only ever receives
anonymised context. Savings projections are computed entirely in-browser and make
no network calls at all.

> General information only — **not** financial advice. Always verify figures at
> [cpf.gov.sg](https://www.cpf.gov.sg).

---

## What it does

- **Balance input** — enter OA / SA / MA, age, and (optionally) income. Values
  stay in the browser; persistence to `localStorage` is opt-in.
- **Local projections** — a deterministic compound-interest model projects balances
  to ages 55/65 using CPF floor rates, with a stacked-area growth chart (and an FRS
  reference line), a current-allocation bar, a CPF LIFE payout comparison, and
  milestone stats (projected RA at 55, years to FRS). No LLM, no network.
- **Explore by life stage** — eight life events (starting work, buying a home,
  buying a BTO flat, getting married, having kids, healthcare, mid-career switch,
  retirement), each with plain-language facts and one-click questions for the assistant.
- **Ask the assistant** — BYOK Claude chat grounded in the knowledge base, rendering
  Markdown replies, with a "New chat" reset and a "See exactly what was sent"
  transparency panel.
- **Jargon buster** — a collapsible glossary of CPF acronyms (BRS/FRS/ERS, OA/SA/MA/RA,
  BHS, EHG, HPS, MOP, MMP, MGN, MRSS, RSTU, …).

## Tech stack

React 19 · Vite · `@anthropic-ai/sdk` (runtime model `claude-haiku-4-5`,
browser BYOK) · `react-markdown` + `remark-gfm` · Vitest · ESLint.

## Getting started

### Prerequisites

- **Node.js 18+** and npm (check with `node -v`). Get it from
  [nodejs.org](https://nodejs.org).
- An **Anthropic API key** for the chat feature — create one at
  [console.anthropic.com](https://console.anthropic.com). The projection charts and
  knowledge base work without a key; only the assistant needs it.

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/CPF-planner.git
cd CPF-planner
```

> Replace `<your-username>` with the repo owner. If you use SSH:
> `git clone git@github.com:<your-username>/CPF-planner.git`

### 2. Install dependencies

```bash
npm install
```

### 3. Run the app (development)

```bash
npm run dev
```

Vite prints a local URL (typically <http://localhost:5173>). Open it in your browser.
The dev server has hot-reload, so edits appear instantly.

### 4. Use it

1. Enter your CPF balances (OA / SA / MA), age, and optionally income — projections
   render immediately, entirely in your browser.
2. To ask the assistant, paste your Anthropic API key into the chat panel. **No `.env`
   or config file is needed** — the key is held only in `sessionStorage` (cleared when
   the tab closes) and sent straight from your browser to Anthropic. Only anonymised
   ranges of your balances are ever transmitted.

### Other commands

```bash
npm test         # run unit tests (sanitiser + knowledge base)
npm run lint     # eslint
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

### Deploying

`npm run build` outputs a static site to `dist/`, which you can host on any static
host (GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc.). There is no backend and
no server-side secret — the API key is supplied per-user in the browser at runtime.

---

## Coding agent used

- **Claude Code** (powered by **Opus 4.8**) — the primary coding agent, used end to
  end for planning, scaffolding, implementation, debugging, and refactoring.
- **Claude API** (`claude-haiku-4-5`) — powers the in-app Q&A at runtime.

## How the agent helped

**Planning.** The agent helped define the three-layer architecture — *knowledge
base → sanitiser → LLM interface* — before any code was written, and surfaced the
key risk early: naive personal-finance AI tends to send raw identifiable data to
public APIs. Designing around that constraint shaped every later decision. It also
researched current CPF figures and life-stage schemes from official sources rather
than guessing.

**Implementation.** The agent generated the CPF rules knowledge base (`cpfRules.js`)
from structured 2026 figures (interest rates, BRS/FRS/ERS, contribution & allocation
rates, BHS, withdrawal rules), the sanitiser (`sanitiser.js`) with an explicit
privacy contract, the local projection model (`projection.js`), the BYOK Claude
wrapper (`claudeClient.js`), and the full React UI (balance input, projection
charts, life-stage explorer, chat, glossary) in a clean editorial design.

**Debugging.** Several issues were root-caused and fixed (see below) — most notably
a privacy-guard false positive and illegitimate citation links.

**Refactoring.** The model's question-to-chat hand-off was refactored from a
`setState`-in-effect pattern (which tripped React's lint rules and risked cascading
renders) to an event-driven imperative handle (`useImperativeHandle`). The calculator
feature was added and then deliberately removed when it proved unreliable, with the
prompt refactored so the model reasons in ranges instead.

## Features built & bugs fixed

**Features**

- Sanitiser layer (`toBand`, `sanitiseProfile`) + a hard `assertNoRawAmounts` guard.
- CPF rules knowledge base: 2026 core figures **plus** eight life-stage categories
  and a glossary, with keyword routing to keep model context focused.
- BYOK Claude chat with Markdown rendering, suggested questions, "New chat" reset,
  and a transparency panel showing the exact anonymised payload.
- Local, deterministic projection charts and milestones.
- Life-stage explorer that feeds curated questions to the assistant.
- BTO scheme guidance scoped to where **CPF is usable as payment** (income ceilings,
  EHG eligibility, OA-payable downpayment, Staggered Downpayment Scheme, instalments).

**Bugs fixed**

- **Privacy-guard false positive.** The guard scanned the *entire* outgoing payload,
  including the public knowledge base. Public CPF figures ($7,000, $14,000, $120,000…)
  could match a user's real balance, so the guard misread a KB figure as a leaked
  balance and aborted legitimate queries (notably BTO questions). Fixed by scoping the
  guard to the **profile block** — the only text derived from the user's raw numbers.
- **Illegitimate citation links.** The model was asked to reproduce source URLs and
  garbled long links into dead ones. Fixed by **stopping the model from emitting URLs**
  (and keeping URLs out of its context) and instead attaching source links from the
  knowledge base itself, rendered as a separate "sources" list — so citations come from
  curated data, not model text.
- **Markdown not rendering.** Replies came through as raw `**asterisks**`; added
  `react-markdown` + `remark-gfm` with themed styles.
- **Inaccurate scaffolded figures.** Reviewed and corrected CPF numbers that the
  initial scaffold had approximated.

## What was cut or simplified

- **PDF statement parsing** — auto-extracting balances from a CPF statement PDF was
  cut; it adds parsing/file-handling complexity without demonstrating the core
  privacy architecture. (Manual entry is used instead.)
- **Live CPF API** — the CPF Board offers no public API for individual account data.
- **Vector DB / semantic retrieval** — replaced with a hardcoded structured knowledge
  base: sufficient for well-scoped planning queries and far easier to audit.
- **Backend, auth, and server-side storage** — deliberately excluded; storing CPF data
  server-side reintroduces the exact risk this design avoids.
- **In-app calculator tool** — built, then removed after the model used it incorrectly;
  arithmetic is now handled by the model reasoning in band midpoints and stating the
  approximation used.

## Weakest part & what to improve next

**Weakest part: the knowledge base is hardcoded and will go stale.** CPF interest
rates and retirement sums change periodically, and there is no mechanism to detect or
reflect those changes. A user relying on outdated figures could plan poorly. Relatedly,
because the assistant only ever sees ranges, any balance-specific arithmetic is an
approximation (midpoint-based) rather than exact.

**Next improvements**

1. **Rules versioning** — tag the KB with a `lastUpdated` date and surface a UI warning
   when it is stale.
2. **Projection accuracy** — model OA→RA transfer rules at 55, contributions past 55,
   extra-interest tiers, and HDB-loan interactions (the current model simplifies these).
3. **Local PDF extraction** — an on-device script that parses a CPF statement and emits
   sanitised JSON, removing manual entry without any cloud exposure.
4. **Stronger evaluation** — broaden sanitiser/edge-case tests and add a periodic check
   that every cited source URL still resolves, so links can't silently rot.

---

## Project layout

```
src/
  data/cpfRules.js        # knowledge base + routing (SOURCES, cpfRules, LIFE_EVENTS, GLOSSARY)
  utils/
    sanitiser.js          # toBand, sanitiseProfile, assertNoRawAmounts (+ tests)
    projection.js         # local compound-interest projection
    claudeClient.js       # BYOK Claude wrapper, system prompt, askCPF
  components/
    BalanceInput.jsx  ProjectionPanel.jsx  LifeEvents.jsx
    ChatInterface.jsx  Glossary.jsx  icons.jsx
  App.jsx  App.css  index.css
planning/PROCESS.md       # design notes & development journal
```
