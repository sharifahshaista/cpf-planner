// Sanitiser — the privacy primitive.
//
// Exact dollar amounts must NEVER leave the browser. Every value that crosses
// the network boundary is first converted into a labelled range ("band") here.
// `assertNoRawAmounts` is the last-line guard run on the serialised request body
// immediately before any API call.

// Ordered, non-overlapping bands. `max` is exclusive; the final band is open-ended.
export const BANDS = [
  { label: 'under $20k', min: 0, max: 20000 },
  { label: '$20k–$50k', min: 20000, max: 50000 },
  { label: '$50k–$100k', min: 50000, max: 100000 },
  { label: '$100k–$150k', min: 100000, max: 150000 },
  { label: '$150k–$220k', min: 150000, max: 220000 },
  { label: '$220k–$300k', min: 220000, max: 300000 },
  { label: '$300k–$500k', min: 300000, max: 500000 },
  { label: 'over $500k', min: 500000, max: Infinity },
]

// Map an exact amount to its band label. Non-finite or negative input → 'unknown'.
export function toBand(amount) {
  if (amount == null || amount === '') return 'unknown'
  const n = Number(amount)
  if (!Number.isFinite(n) || n < 0) return 'unknown'
  const band = BANDS.find((b) => n >= b.min && n < b.max)
  return band ? band.label : BANDS[BANDS.length - 1].label
}

// Convert a raw profile into an anonymised one. Dollar fields become band labels;
// age is kept exact because CPF eligibility hinges on precise ages (55/65/70) and
// age alone is low-identifiability.
export function sanitiseProfile(profile = {}) {
  const { oa = 0, sa = 0, ma = 0, age = null, income = null } = profile
  const total = Number(oa) + Number(sa) + Number(ma)
  return {
    oaBand: toBand(oa),
    saBand: toBand(sa),
    maBand: toBand(ma),
    totalBand: toBand(total),
    incomeBand: income == null || income === '' ? null : toBand(income),
    age: age == null || age === '' ? null : Number(age),
  }
}

// Reduce a raw statement-date/period string to a NON-identifying period. We keep
// at most the month and year (e.g. "Mar 2026" or "2026") and drop day-level
// precision, which lowers identifiability while preserving recency context.
function toPeriod(dateStr) {
  if (!dateStr) return null
  const monthYear = /([A-Za-z]{3,9})\s+([0-9]{4})/.exec(dateStr)
  if (monthYear) return `${monthYear[1].slice(0, 3)} ${monthYear[2]}`
  const year = /(20[0-9]{2})/.exec(dateStr)
  return year ? year[1] : null
}

// Sanitise a document parsed by claudeParser into a banded, PII-free summary safe to
// attach to a chat request. Every dollar figure becomes a band; identifying
// free-text (NRIC, names, employers, exact dates) is deliberately DROPPED — only
// bands, counts, an age, and a coarse period survive. This is what keeps the
// "attach document context" feature consistent with the zero-retention contract.
//
// To instead send the raw figures (accepting that they leave the browser), a
// caller would bypass this and inject `doc` directly — but the outgoing leak
// guard would then reject it, by design.
export function sanitiseDocument(doc = {}) {
  const { accounts = {}, totalBalance, income, age, statementDate, contributions = [] } = doc
  const amounts = contributions
    .map((c) => Number(c?.amount))
    .filter((n) => Number.isFinite(n) && n > 0)
  const latestContribution = amounts.length ? amounts[amounts.length - 1] : null
  return {
    oaBand: toBand(accounts.oa),
    saBand: toBand(accounts.sa),
    maBand: toBand(accounts.ma),
    raBand: accounts.ra == null ? null : toBand(accounts.ra),
    totalBand: toBand(totalBalance),
    incomeBand: income == null ? null : toBand(income),
    age: age == null ? null : Number(age),
    statementPeriod: toPeriod(statementDate),
    contributionCount: contributions.length,
    latestContributionBand: latestContribution == null ? null : toBand(latestContribution),
  }
}

// Collect the raw numeric amounts from a profile (for the leak guard).
function rawAmountsOf(profile = {}) {
  const { oa, sa, ma, income } = profile
  const total = Number(oa || 0) + Number(sa || 0) + Number(ma || 0)
  return [oa, sa, ma, income, total]
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
}

// Last-line defence: scan an outgoing payload string for any of the user's exact
// amounts and THROW if found. Matches the bare integer and common formatted
// variants (commas, $ prefix). Deliberately conservative — a false positive is
// far cheaper than leaking a balance.
export function assertNoRawAmounts(outgoingText, rawProfile) {
  const text = String(outgoingText)
  for (const amount of rawAmountsOf(rawProfile)) {
    const variants = new Set([
      String(amount),
      amount.toLocaleString('en-US'), // 123,456
      amount.toLocaleString('en-US').replace(/,/g, ''),
    ])
    for (const v of variants) {
      // Word-boundary match so '20000' doesn't trip on '120000' substrings.
      const re = new RegExp(`(?<![\\d.])\\$?${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\d])`)
      if (re.test(text)) {
        throw new Error(
          `Privacy guard: raw amount "${v}" detected in outgoing payload — refusing to send.`,
        )
      }
    }
  }
  return true
}
