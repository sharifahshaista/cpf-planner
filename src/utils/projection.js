// Local, deterministic CPF projection. Runs entirely in the browser — no LLM,
// no network. Operates on RAW amounts (which never leave this module's caller).
//
// Model is intentionally simple and transparent: annual compounding at CPF floor
// interest rates, with optional monthly contributions allocated by age band.
// It is an estimate, not official CPF guidance.

import { cpfRules } from '../data/cpfRules.js'

const { oa: OA_RATE, sa: SA_RATE, ma: MA_RATE } = cpfRules.interestRates

// Pick the wage-allocation row for a given age (percent of wages to OA/SA/MA).
function allocationForAge(age) {
  const rows = cpfRules.allocation.byAge
  if (age <= 35) return rows[0]
  if (age <= 45) return rows[1]
  if (age <= 50) return rows[2]
  return rows[3] // 50–55; we stop contributing at 55 in this model
}

const pct = (n) => n / 100

// Project balances year by year from the member's current age up to `toAge`.
// `monthlyIncome` is optional; contributions are capped at the Ordinary Wage
// ceiling and stop at age 55 (when the RA forms — a deliberate simplification).
export function projectBalances(profile, toAge = 65) {
  const startAge = Number(profile.age)
  let oa = Number(profile.oa) || 0
  let sa = Number(profile.sa) || 0
  let ma = Number(profile.ma) || 0
  const income = Number(profile.income) || 0
  const cappedIncome = Math.min(income, cpfRules.wageCeilings.ordinaryWageCeilingMonthly)

  const series = [{ age: startAge, oa, sa, ma, total: oa + sa + ma }]
  if (!Number.isFinite(startAge) || startAge >= toAge) return series

  for (let age = startAge; age < toAge; age++) {
    // Contributions for this year (only while working and under 55).
    if (cappedIncome > 0 && age < 55) {
      const alloc = allocationForAge(age)
      const annualWages = cappedIncome * 12
      oa += annualWages * pct(alloc.oa)
      sa += annualWages * pct(alloc.sa)
      ma += annualWages * pct(alloc.ma)
    }
    // Interest, compounded annually.
    oa *= 1 + pct(OA_RATE)
    sa *= 1 + pct(SA_RATE)
    ma *= 1 + pct(MA_RATE)

    series.push({
      age: age + 1,
      oa: Math.round(oa),
      sa: Math.round(sa),
      ma: Math.round(ma),
      total: Math.round(oa + sa + ma),
    })
  }
  return series
}

// At 55 the RA is formed from SA + OA up to the Full Retirement Sum. Estimate it.
export function projectedRAAt55(profile) {
  if (!Number.isFinite(Number(profile.age))) return null
  const at55 = projectBalances(profile, 55)
  const point = at55[at55.length - 1]
  const retirementPool = point.sa + point.oa // SA first, then OA
  const ra = Math.min(retirementPool, cpfRules.retirementSums.frs.amount)
  return {
    age: point.age,
    ra: Math.round(ra),
    retirementPool: Math.round(retirementPool),
    meetsFRS: retirementPool >= cpfRules.retirementSums.frs.amount,
    meetsBRS: retirementPool >= cpfRules.retirementSums.brs.amount,
  }
}

// Rough estimate of when the combined SA+OA pool first reaches the FRS.
export function yearsToFRS(profile) {
  const frs = cpfRules.retirementSums.frs.amount
  const startAge = Number(profile.age)
  if (!Number.isFinite(startAge)) return null
  const series = projectBalances(profile, 55)
  for (const p of series) {
    if (p.sa + p.oa >= frs) return { years: p.age - startAge, atAge: p.age }
  }
  return { years: null, atAge: null } // not reached by 55 under this model
}
