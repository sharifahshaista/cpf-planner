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
