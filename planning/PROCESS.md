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
* Illegitimate website URLs presented in generated responses as references. Fixed it to only reference sources 
found in knowledge base. 

*Refactoring*
[Fill in — e.g. if you collapsed components, changed state management approach]

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
individual account data.

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

**Next improvements:**

1. **Rules versioning** — tag the knowledge base with a `lastUpdated` date and 
   surface a visible warning in the UI if it is more than 6 months old.

2. **Local PDF extraction** — build a Python script that runs entirely on the 
   user's machine, parses their CPF statement PDF, and outputs a sanitised JSON 
   file that the app can ingest. This would remove the manual balance entry 
   step without introducing any cloud data exposure.

3. **Projection accuracy** — current projections use simplified compound 
   interest logic and do not account for the OA-to-SA transfer rules, CPF LIFE 
   payout estimates, or HDB loan interactions. A more complete financial model 
   would handle these.

4. **Evaluation layer** — add a small test suite that checks the sanitiser 
   against edge cases (e.g. amounts at range boundaries, zero balances, 
   non-numeric inputs) to give confidence that no raw figures leak through.