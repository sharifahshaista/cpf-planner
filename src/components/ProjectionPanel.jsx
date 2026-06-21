import { useMemo } from 'react'
import { projectBalances, projectedRAAt55, yearsToFRS } from '../utils/projection.js'
import { cpfRules } from '../data/cpfRules.js'

// Local projection display. Everything is computed in-browser — no network calls.
// Three views: a stacked-area growth chart, a current-allocation bar, and a
// CPF LIFE payout comparison, so the numbers feel concrete.

const ACCENTS = { oa: '#2f6f8f', sa: '#3f8f6f', ma: '#c06a3e' }
const dollars = (n) => '$' + Math.round(n).toLocaleString('en-US')
const kfmt = (n) => '$' + Math.round(n / 1000) + 'k'

export default function ProjectionPanel({ profile }) {
  const ready = profile.age !== '' && profile.age != null && Number(profile.age) > 0

  const data = useMemo(() => {
    if (!ready) return null
    const series = projectBalances(profile, 65)
    const maxTotal = Math.max(...series.map((p) => p.total), 1)
    return {
      series,
      maxTotal,
      ra: projectedRAAt55(profile),
      frsTiming: yearsToFRS(profile),
      now: series[0],
    }
  }, [profile, ready])

  if (!ready) {
    return (
      <section className="card projection">
        <div className="section-head">
          <h2>Your projection</h2>
          <p className="lede">Enter your age and balances to see how your CPF could grow.</p>
        </div>
        <p className="empty-hint">Waiting for your age…</p>
      </section>
    )
  }

  const { series, maxTotal, ra, frsTiming, now } = data
  const frs = cpfRules.retirementSums.frs.amount

  return (
    <section className="card projection">
      <div className="section-head">
        <h2>Your projection</h2>
        <p className="lede">
          A simple estimate using CPF floor interest (OA {cpfRules.interestRates.oa}%, SA/MA{' '}
          {cpfRules.interestRates.sa}%), computed entirely in your browser.
        </p>
      </div>

      <div className="milestones">
        <Stat label="Total CPF today" value={dollars(now.total)} sub={`at age ${now.age}`} />
        <Stat
          label="Projected RA at 55"
          value={ra ? dollars(ra.ra) : '—'}
          sub={ra?.meetsFRS ? 'Meets the FRS' : ra?.meetsBRS ? 'Meets the BRS' : 'Below the BRS'}
          tone={ra?.meetsFRS ? 'good' : ra?.meetsBRS ? 'mid' : 'low'}
        />
        <Stat
          label="On track for FRS"
          value={frsTiming?.atAge ? `Age ${frsTiming.atAge}` : 'Not by 55'}
          sub={frsTiming?.years != null ? `in about ${frsTiming.years} years` : 'under this estimate'}
        />
      </div>

      <GrowthChart series={series} maxTotal={maxTotal} frs={frs} />

      <div className="sub-charts">
        <AllocationBar now={now} />
        <PayoutChart />
      </div>

      <p className="disclaimer">
        Estimate only — contributions are assumed to stop at 55 and growth uses floor rates. Not
        financial advice.
      </p>
    </section>
  )
}

function Stat({ label, value, sub, tone }) {
  return (
    <div className="milestone">
      <span className="m-label">{label}</span>
      <span className="m-value">{value}</span>
      <span className={`m-sub${tone ? ' tone-' + tone : ''}`}>{sub}</span>
    </div>
  )
}

// Stacked-area chart of OA/SA/MA growth with a dashed FRS reference line.
function GrowthChart({ series, maxTotal, frs }) {
  const W = 560
  const H = 240
  const pad = { l: 44, r: 14, t: 14, b: 28 }
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b

  const ages = series.map((p) => p.age)
  const minAge = ages[0]
  const maxAge = ages[ages.length - 1]
  const yTop = Math.ceil(maxTotal / 50000) * 50000 || 50000

  const sx = (age) => pad.l + ((age - minAge) / Math.max(1, maxAge - minAge)) * iw
  const sy = (val) => pad.t + ih - (val / yTop) * ih

  // Build stacked layers bottom-up: MA, then SA, then OA.
  const layer = (lowerKeys, key) => {
    const top = series.map((p) => {
      const base = lowerKeys.reduce((sum, k) => sum + p[k], 0)
      return { x: sx(p.age), y: sy(base + p[key]) }
    })
    const bottom = series.map((p) => {
      const base = lowerKeys.reduce((sum, k) => sum + p[k], 0)
      return { x: sx(p.age), y: sy(base) }
    })
    const path = [
      `M ${top[0].x} ${top[0].y}`,
      ...top.slice(1).map((pt) => `L ${pt.x} ${pt.y}`),
      ...bottom.reverse().map((pt) => `L ${pt.x} ${pt.y}`),
      'Z',
    ].join(' ')
    return path
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yTop * f))
  const ageTicks = series.filter((p, i) => i === 0 || p.age === 55 || i === series.length - 1)

  return (
    <figure className="chart-figure">
      <figcaption>Projected balances by age</figcaption>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Projected CPF balances by age">
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} className="grid" />
            <text x={pad.l - 8} y={sy(t) + 4} textAnchor="end" className="axis-label">
              {kfmt(t)}
            </text>
          </g>
        ))}

        <path d={layer([], 'ma')} fill={ACCENTS.ma} fillOpacity="0.85" />
        <path d={layer(['ma'], 'sa')} fill={ACCENTS.sa} fillOpacity="0.85" />
        <path d={layer(['ma', 'sa'], 'oa')} fill={ACCENTS.oa} fillOpacity="0.85" />

        {frs <= yTop && (
          <g>
            <line x1={pad.l} x2={W - pad.r} y1={sy(frs)} y2={sy(frs)} className="ref-line" />
            <text x={W - pad.r} y={sy(frs) - 6} textAnchor="end" className="ref-label">
              FRS {kfmt(frs)}
            </text>
          </g>
        )}

        {ageTicks.map((p) => (
          <text key={p.age} x={sx(p.age)} y={H - 8} textAnchor="middle" className="axis-label">
            age {p.age}
          </text>
        ))}
      </svg>
      <Legend />
    </figure>
  )
}

function AllocationBar({ now }) {
  const total = now.total || 1
  const segs = [
    { key: 'oa', label: 'OA', val: now.oa },
    { key: 'sa', label: 'SA', val: now.sa },
    { key: 'ma', label: 'MA', val: now.ma },
  ]
  return (
    <figure className="chart-figure">
      <figcaption>Where your money sits today</figcaption>
      <div className="alloc-bar">
        {segs.map((s) => {
          const pct = (s.val / total) * 100
          if (pct <= 0) return null
          return (
            <span
              key={s.key}
              className="alloc-seg"
              style={{ width: `${pct}%`, background: ACCENTS[s.key] }}
              title={`${s.label}: ${dollars(s.val)}`}
            >
              {pct > 12 ? `${s.label} ${Math.round(pct)}%` : ''}
            </span>
          )
        })}
      </div>
      <Legend />
    </figure>
  )
}

// CPF LIFE payout comparison — makes the retirement sums tangible.
function PayoutChart() {
  const { brs, frs, ers } = cpfRules.retirementSums
  const rows = [
    { label: 'BRS', payout: brs.estMonthlyPayoutFrom65 },
    { label: 'FRS', payout: frs.estMonthlyPayoutFrom65 },
    { label: 'ERS', payout: ers.estMonthlyPayoutFrom65 },
  ]
  const max = Math.max(...rows.map((r) => r.payout))
  return (
    <figure className="chart-figure">
      <figcaption>Est. monthly payout from 65</figcaption>
      <div className="payout-rows">
        {rows.map((r) => (
          <div key={r.label} className="payout-row">
            <span className="payout-key">{r.label}</span>
            <span className="payout-track">
              <span className="payout-fill" style={{ width: `${(r.payout / max) * 100}%` }} />
            </span>
            <span className="payout-val">{dollars(r.payout)}</span>
          </div>
        ))}
      </div>
    </figure>
  )
}

function Legend() {
  return (
    <div className="legend">
      <span><i style={{ background: ACCENTS.oa }} /> Ordinary</span>
      <span><i style={{ background: ACCENTS.sa }} /> Special</span>
      <span><i style={{ background: ACCENTS.ma }} /> MediSave</span>
    </div>
  )
}
