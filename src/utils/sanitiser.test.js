import { describe, it, expect } from 'vitest'
import {
  toBand,
  sanitiseProfile,
  sanitiseDocument,
  assertNoRawAmounts,
  BANDS,
} from './sanitiser.js'

describe('toBand', () => {
  it('maps amounts into the correct band', () => {
    expect(toBand(0)).toBe('under $20k')
    expect(toBand(19999)).toBe('under $20k')
    expect(toBand(20000)).toBe('$20k–$50k')
    expect(toBand(125000)).toBe('$100k–$150k')
    expect(toBand(220400)).toBe('$220k–$300k')
    expect(toBand(750000)).toBe('over $500k')
  })

  it('handles invalid input', () => {
    expect(toBand(-5)).toBe('unknown')
    expect(toBand('abc')).toBe('unknown')
    expect(toBand(null)).toBe('unknown')
  })

  it('bands are contiguous and non-overlapping', () => {
    for (let i = 1; i < BANDS.length; i++) {
      expect(BANDS[i].min).toBe(BANDS[i - 1].max)
    }
  })
})

describe('sanitiseProfile', () => {
  it('emits only band labels and exact age, never raw amounts', () => {
    const out = sanitiseProfile({ oa: 123456, sa: 88000, ma: 45000, age: 42, income: 6500 })
    expect(out).toEqual({
      oaBand: '$100k–$150k',
      saBand: '$50k–$100k',
      maBand: '$20k–$50k',
      totalBand: '$220k–$300k', // 256,456 total
      incomeBand: 'under $20k',
      age: 42,
    })
    const serialised = JSON.stringify(out)
    for (const raw of ['123456', '88000', '45000', '6500']) {
      expect(serialised).not.toContain(raw)
    }
  })

  it('treats missing income/age as null', () => {
    const out = sanitiseProfile({ oa: 10000, sa: 0, ma: 0 })
    expect(out.incomeBand).toBeNull()
    expect(out.age).toBeNull()
  })
})

describe('sanitiseDocument', () => {
  const doc = {
    accounts: { oa: 82000, sa: 61500, ma: 45250, ra: 0 },
    totalBalance: 188750,
    income: 6000,
    age: 42,
    statementDate: '30 Jun 2026',
    contributions: [
      { date: '15/04/2026', amount: 1110 },
      { date: '15/05/2026', amount: 1110 },
      { date: '15/06/2026', amount: 1250 },
    ],
  }

  it('bands every dollar figure and drops day-level date precision', () => {
    const out = sanitiseDocument(doc)
    expect(out.oaBand).toBe('$50k–$100k')
    expect(out.saBand).toBe('$50k–$100k')
    expect(out.maBand).toBe('$20k–$50k')
    expect(out.raBand).toBe('under $20k')
    expect(out.totalBand).toBe('$150k–$220k')
    expect(out.incomeBand).toBe('under $20k')
    expect(out.age).toBe(42)
    expect(out.statementPeriod).toBe('Jun 2026')
    expect(out.contributionCount).toBe(3)
    expect(out.latestContributionBand).toBe('under $20k')
  })

  it('never leaks a raw figure from the document', () => {
    const serialised = JSON.stringify(sanitiseDocument(doc))
    for (const raw of ['82000', '61500', '45250', '188750', '6000', '1110', '1250']) {
      expect(serialised).not.toContain(raw)
    }
  })

  it('handles a sparse document without throwing', () => {
    const out = sanitiseDocument({ accounts: { oa: 10000 } })
    expect(out.oaBand).toBe('under $20k')
    expect(out.saBand).toBe('unknown')
    expect(out.raBand).toBeNull()
    expect(out.statementPeriod).toBeNull()
    expect(out.contributionCount).toBe(0)
  })
})

describe('assertNoRawAmounts (leak guard)', () => {
  const raw = { oa: 123456, sa: 88000, ma: 45000, income: 6500 }

  it('passes when payload contains only bands', () => {
    const payload = JSON.stringify(sanitiseProfile(raw))
    expect(assertNoRawAmounts(payload, raw)).toBe(true)
  })

  it('throws when a raw amount leaks (bare)', () => {
    expect(() => assertNoRawAmounts('my OA is 123456 dollars', raw)).toThrow(/Privacy guard/)
  })

  it('throws when a raw amount leaks (formatted with commas / $)', () => {
    expect(() => assertNoRawAmounts('balance: $123,456', raw)).toThrow(/Privacy guard/)
  })

  it('throws on a leaked computed total', () => {
    const total = 123456 + 88000 + 45000 // 256456
    expect(() => assertNoRawAmounts(`total is ${total}`, raw)).toThrow(/Privacy guard/)
  })

  it('does not false-positive on a band label containing similar digits', () => {
    // 20000 is not one of the raw amounts; band label "$20k" must not trip.
    expect(assertNoRawAmounts('$20k–$50k', raw)).toBe(true)
  })
})
