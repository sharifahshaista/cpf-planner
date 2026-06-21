// CPF Rules Knowledge Base.
//
// This is the ONLY CPF domain context sent to Claude. It contains no personal
// data — only published, official figures and plain-language rule statements,
// each carrying a `source` URL so answers can be grounded and audited.
//
// Two parts:
//   1. `cpfRules`   — core numeric facts (2026 figures): sums, rates, ceilings.
//   2. `LIFE_EVENTS`— life-stage guidance organised the way CPF's own
//                     educational resources are: by what's happening in your life.
//
// NOTE: CPF figures change yearly. Spot-check against cpf.gov.sg before relying
// on these for real decisions. Last reviewed for the 2026 cohort.

// Curated, OFFICIAL-only source URLs. Every URL here has been verified to
// return HTTP 200 (no 404s, no cross-host redirects, no third-party blogs).
// These are the only links ever shown to users — the app attaches them
// deterministically (see `collectSources`); the model never emits URLs, so it
// cannot garble or invent them. If you add/change a URL, re-verify it loads.
export const SOURCES = {
  retirementSums:
    'https://www.cpf.gov.sg/service/article/what-are-the-retirement-sums-basic-retirement-sum-brs-full-retirement-sum-frs-and-enhanced-retirement-sum-ers',
  ersChange2026:
    'https://www.cpf.gov.sg/service/article/what-is-the-change-to-the-enhanced-retirement-sum-in-2026',
  contributionRates:
    'https://www.cpf.gov.sg/member/infohub/educational-resources/new-cpf-contribution-rates-for-senior-workers',
  allocationRates: 'https://www.cpf.gov.sg/service/article/what-are-the-cpf-allocation-rates',
  interestRates:
    'https://www.cpf.gov.sg/member/growing-your-savings/earning-higher-returns/earning-attractive-interest',
  overview: 'https://www.cpf.gov.sg/member/cpf-overview',
  housing: 'https://www.cpf.gov.sg/member/home-ownership/using-your-cpf-to-buy-a-home',
  housingGrant:
    'https://www.cpf.gov.sg/member/infohub/educational-resources/a-guide-to-enhanced-cpf-housing-and-proximity-grant',
  selfEmployed:
    'https://www.cpf.gov.sg/member/growing-your-savings/cpf-contributions/saving-as-a-self-employed-person',
  nomination:
    'https://www.cpf.gov.sg/member/account-services/providing-for-your-loved-ones/making-a-cpf-nomination',
  topUps:
    'https://www.cpf.gov.sg/member/growing-your-savings/saving-more-with-cpf/top-up-ordinary-special-and-medisave-savings',
  matchingGrant:
    'https://www.cpf.gov.sg/member/growing-your-savings/government-support/matching-grant-for-retirement',
  medishield: 'https://www.cpf.gov.sg/member/healthcare-financing/medishield-life',
  careshield: 'https://www.cpf.gov.sg/member/healthcare-financing/careshield-life',
  newbornGrant:
    'https://www.cpf.gov.sg/member/infohub/educational-resources/how-medishield-life-supports-you-for-life',
  cpfLife: 'https://www.cpf.gov.sg/member/retirement-income/monthly-payouts/cpf-life',
}

// Friendly display labels per URL for the citation list. Falls back to hostname.
export const SOURCE_LABELS = {
  [SOURCES.retirementSums]: 'CPF: Retirement sums (BRS, FRS, ERS)',
  [SOURCES.ersChange2026]: 'CPF: Change to the Enhanced Retirement Sum in 2026',
  [SOURCES.contributionRates]: 'CPF: Contribution rates for senior workers',
  [SOURCES.allocationRates]: 'CPF: CPF allocation rates',
  [SOURCES.interestRates]: 'CPF: Earning CPF interest',
  [SOURCES.overview]: 'CPF: CPF overview',
  [SOURCES.housing]: 'CPF: Using your CPF to buy a home',
  [SOURCES.housingGrant]: 'CPF: Enhanced CPF Housing Grant & Proximity Grant',
  [SOURCES.selfEmployed]: 'CPF: Saving as a self-employed person',
  [SOURCES.nomination]: 'CPF: Making a CPF nomination',
  [SOURCES.topUps]: 'CPF: Top up your CPF savings',
  [SOURCES.matchingGrant]: 'CPF: Matching grant for retirement (MRSS)',
  [SOURCES.medishield]: 'CPF: MediShield Life',
  [SOURCES.careshield]: 'CPF: CareShield Life',
  [SOURCES.newbornGrant]: 'CPF: How MediShield Life supports you for life',
  [SOURCES.cpfLife]: 'CPF: CPF LIFE',
}

export const cpfRules = {
  year: 2026,
  currency: 'SGD',

  retirementSums: {
    label: 'Retirement sums',
    source: SOURCES.retirementSums,
    note: 'Applies to members turning 55 in 2026. FRS is 2× BRS; ERS is 2× FRS.',
    brs: { amount: 110200, estMonthlyPayoutFrom65: 950 },
    frs: { amount: 220400, estMonthlyPayoutFrom65: 1780 },
    ers: { amount: 440800, estMonthlyPayoutFrom65: 3440 },
    statements: [
      'The Basic Retirement Sum (BRS) for the 2026 cohort is $110,200 and provides an estimated CPF LIFE payout of about $950/month from age 65.',
      'The Full Retirement Sum (FRS) is $220,400 — the default amount set aside in the Retirement Account at 55 — giving roughly $1,780/month from 65.',
      'The Enhanced Retirement Sum (ERS) is $440,800, the maximum top-up target, giving roughly $3,440/month from 65.',
      'Members who own property and make a property pledge may set aside only the BRS and withdraw the rest above it.',
    ],
  },

  wageCeilings: {
    label: 'Wage ceilings',
    source: SOURCES.overview,
    ordinaryWageCeilingMonthly: 8000,
    annualWageCeiling: 102000,
    statements: [
      'From 1 January 2026 the Ordinary Wage ceiling is $8,000/month — CPF contributions are only computed on monthly wages up to this amount.',
      'The Annual Wage ceiling (covering ordinary + additional wages such as bonuses) is $102,000.',
    ],
  },

  contributionRates: {
    label: 'Contribution rates',
    source: SOURCES.contributionRates,
    byAge: [
      { band: '55 and below', total: 37, employer: 17, employee: 20 },
      { band: 'above 55 to 60', total: 34, employer: 16, employee: 18 },
      { band: 'above 60 to 65', total: 25, employer: 12.5, employee: 12.5 },
      { band: 'above 65 to 70', total: 16.5, employer: 9, employee: 7.5 },
      { band: 'above 70', total: 12.5, employer: 7.5, employee: 5 },
    ],
    statements: [
      'Total CPF contribution is 37% of wages for employees aged 55 and below (17% employer, 20% employee).',
      'In 2026 rates for older workers rose: 34% for above 55–60 and 25% for above 60–65.',
    ],
  },

  allocation: {
    label: 'Account allocation',
    source: SOURCES.allocationRates,
    note: 'Share of total wages directed to each account; shifts from OA toward MA/RA with age.',
    byAge: [
      { band: '35 and below', oa: 23, sa: 6, ma: 8 },
      { band: 'above 35 to 45', oa: 21, sa: 7, ma: 9 },
      { band: 'above 45 to 50', oa: 19, sa: 8, ma: 10 },
      { band: 'above 50 to 55', oa: 15, sa: 11.5, ma: 10.5 },
    ],
    statements: [
      'For members 35 and below, contributions split roughly OA 23%, SA 6%, MA 8% of wages.',
      'As members age, allocation shifts away from the Ordinary Account toward the MediSave and (from 55) Retirement Account.',
    ],
  },

  bhs: {
    label: 'Basic Healthcare Sum',
    source: SOURCES.overview,
    amount: 79000,
    statements: [
      'The Basic Healthcare Sum (BHS) — the MediSave cap — is $79,000 in 2026. Once 65, a member’s BHS is fixed for life at the prevailing figure that year.',
      'MediSave contributions beyond the BHS overflow to the Special Account (before 55) or Retirement Account / Ordinary Account.',
    ],
  },

  interestRates: {
    label: 'Interest rates',
    source: SOURCES.interestRates,
    oa: 2.5,
    sa: 4.0,
    ma: 4.0,
    ra: 4.0,
    note: 'Floor rates; CPF reviews quarterly. Extra interest applies as below.',
    extraInterest: [
      'An extra 1% is paid on the first $60,000 of combined balances (capped at $20,000 from the OA).',
      'Members aged 55 and above earn a further extra 1% on the first $30,000 of combined balances (total +2% on that tranche).',
    ],
    statements: [
      'The Ordinary Account earns 2.5% per year; the Special, MediSave and Retirement Accounts earn a 4.0% floor.',
      'Extra interest boosts effective returns on the first $60,000 of balances (and the first $30,000 for those 55+).',
    ],
  },

  accountStructure: {
    label: 'Account structure',
    source: SOURCES.overview,
    statements: [
      'Ordinary Account (OA): housing, insurance, investment and education.',
      'Special Account (SA): retirement-related savings (before 55).',
      'MediSave Account (MA): hospitalisation and approved medical insurance (MediShield Life, CareShield Life).',
      'Retirement Account (RA): formed at age 55 by combining SA and OA savings up to the Full Retirement Sum, to fund CPF LIFE payouts.',
      'From 2025, the Special Account is closed for members aged 55 and above; those savings move to the RA (up to the FRS), and any excess to the OA.',
    ],
  },

  withdrawals: {
    label: 'Withdrawals at 55',
    source: SOURCES.retirementSums,
    statements: [
      'From age 55, members can withdraw up to $5,000 unconditionally, regardless of how much they have.',
      'Beyond that, members can withdraw savings above their set-aside Retirement Sum (BRS with a sufficient property pledge, otherwise FRS).',
      'CPF LIFE payouts are the default lifelong monthly income and begin from the payout eligibility age (currently 65); they can be deferred to age 70 for higher payouts.',
      'MediSave cannot be withdrawn as cash on turning 55; it remains for approved healthcare use.',
    ],
  },
}

// ---------------------------------------------------------------------------
// Life events — organised the way CPF's educational resources are.
// `icon` maps to an inline SVG in the UI. `sampleQuestions` seed the chat.
// ---------------------------------------------------------------------------

export const LIFE_EVENTS = [
  {
    id: 'starting-work',
    title: 'Starting work',
    icon: 'briefcase',
    blurb: 'Your first CPF contributions, where the money goes, and your first admin task.',
    sampleQuestions: [
      'How is my CPF split across OA, SA and MA when I start work?',
      'Do I need to do a CPF nomination?',
    ],
    sources: [SOURCES.allocationRates, SOURCES.nomination, SOURCES.selfEmployed],
    statements: [
      'Once employed, 37% of your wages (up to the $8,000/month ceiling) goes to CPF — 20% from you, 17% from your employer.',
      'For workers aged 35 and below, contributions split roughly 23% to the Ordinary Account, 6% to the Special Account and 8% to MediSave.',
      'Make a CPF nomination early: without one, your CPF savings are distributed by the Public Trustee under intestacy law rather than to whom you choose. Marriage later revokes an existing nomination.',
      'If you freelance or are self-employed, only MediSave contributions are compulsory (when net trade income exceeds $6,000/year); OA and SA contributions are voluntary.',
    ],
  },
  {
    id: 'buying-a-home',
    title: 'Buying a home',
    icon: 'home',
    blurb: 'Using your OA, the accrued-interest catch, and the grants you may qualify for.',
    sampleQuestions: [
      'Can I use my OA for a HDB downpayment?',
      'What is CPF accrued interest and why does it matter when I sell?',
    ],
    sources: [SOURCES.housing, SOURCES.housingGrant],
    statements: [
      'Ordinary Account savings can pay for the downpayment, monthly housing-loan instalments, stamp and legal fees, and Home Protection Scheme premiums (HDB flats).',
      'Any OA money used for housing accrues “accrued interest” at 2.5%/year, compounded. When you sell, the amount withdrawn plus this accrued interest must be refunded to your CPF — this protects your retirement savings.',
      'First-timer families may receive CPF housing grants (Enhanced CPF Housing Grant, Family Grant for resale flats, Proximity Housing Grant for living near family). Grants are credited to the OA and must also be refunded with accrued interest on sale.',
      'The Home Protection Scheme is a mortgage-reducing insurance that pays the outstanding HDB loan if an insured member dies or is permanently incapacitated.',
    ],
  },
  {
    id: 'buying-a-bto',
    title: 'Buying a BTO flat',
    icon: 'building',
    blurb: 'Income ceilings, the downpayment you can cover with CPF, and grant eligibility.',
    sampleQuestions: [
      'How much of my BTO downpayment can I pay with CPF?',
      'Am I eligible for the Enhanced CPF Housing Grant?',
    ],
    sources: [SOURCES.housingGrant, SOURCES.housing],
    statements: [
      'To buy a new BTO flat the household income ceiling is generally $14,000 (families), or $7,000 for singles buying a 2-room Flexi flat. Meeting it is what lets you buy and qualify for CPF housing grants.',
      'First-timer families can receive an Enhanced CPF Housing Grant (EHG) of up to $120,000 (first-timer singles: up to $60,000). It is credited to your CPF Ordinary Account to offset the flat price.',
      'The EHG has its own income ceiling — $9,000/month for families ($4,500 for singles) — and tapers as income rises (e.g. about $5,000 for households earning $7,001–$9,000, scaling up to the maximum for the lowest incomes).',
      'With an HDB housing loan (loan-to-value 75%), the 25% downpayment can be paid entirely from your CPF Ordinary Account — your cash outlay can be $0 if your OA covers it.',
      'With a bank loan (loan-to-value 75%), the 25% downpayment needs at least 5% in cash, with the remaining 20% payable from CPF OA.',
      'Under the Staggered Downpayment Scheme the downpayment is split into 2.5% at signing and 22.5% at key collection — both tranches can come from CPF OA.',
      'Monthly housing-loan instalments for the flat can be paid from CPF OA. Grants and any OA used accrue 2.5% accrued interest, refundable to CPF when you sell.',
    ],
  },
  {
    id: 'getting-married',
    title: 'Getting married',
    icon: 'rings',
    blurb: 'Housing grants for couples, transfers to your spouse, and updating your nomination.',
    sampleQuestions: [
      'What CPF housing grants can my spouse and I get?',
      'Can I transfer CPF savings to my spouse?',
    ],
    sources: [SOURCES.housingGrant, SOURCES.topUps, SOURCES.nomination],
    statements: [
      'Marriage automatically revokes any existing CPF nomination — make a new one afterwards so your savings go where you intend.',
      'Married couples can qualify for the Enhanced CPF Housing Grant, the Family Grant (resale) and the Proximity Housing Grant.',
      'If you received a CPF Housing Grant as a single and later marry, you may claim a Top-Up Grant — but you must apply within 6 months of registering your marriage.',
      'You can transfer CPF savings to your spouse’s account, but only after first setting aside the Basic Retirement Sum for your own future payouts.',
    ],
  },
  {
    id: 'having-kids',
    title: 'Having kids',
    icon: 'child',
    blurb: 'MediSave for delivery, the newborn grant, and automatic health cover from birth.',
    sampleQuestions: [
      'How can MediSave help with delivery costs?',
      'What is the MediSave Grant for Newborns?',
    ],
    sources: [SOURCES.newbornGrant, SOURCES.medishield],
    statements: [
      'The MediSave Maternity Package lets you use MediSave for delivery and pre-delivery costs — up to $1,130/day for the first two days, $400/day thereafter, plus up to $900 for pre-delivery care and a surgical limit for the delivery procedure.',
      'Singapore Citizen newborns receive a $5,000 MediSave Grant for Newborns, credited automatically at birth registration, to pay MediShield Life premiums, vaccinations and approved treatments.',
      'Babies who are Singapore Citizens or PRs are automatically enrolled in MediShield Life from birth, including cover for congenital conditions.',
      'A CPF nomination should be reviewed when you have children so your savings provide for them.',
    ],
  },
  {
    id: 'healthcare',
    title: 'Healthcare needs',
    icon: 'health',
    blurb: 'What MediSave, MediShield Life and CareShield Life pay for through life.',
    sampleQuestions: [
      'What can I use my MediSave for?',
      'What is the difference between MediShield Life and CareShield Life?',
    ],
    sources: [SOURCES.medishield, SOURCES.careshield, SOURCES.overview],
    statements: [
      'MediSave pays for hospitalisation, day surgery, certain outpatient treatments, and the premiums of MediShield Life and CareShield Life. The MediSave cap (Basic Healthcare Sum) is $79,000 in 2026.',
      'MediShield Life is a basic health-insurance scheme that covers large hospital bills and selected costly outpatient treatments for life, regardless of age or pre-existing conditions.',
      'CareShield Life is long-term-care insurance giving lifelong monthly payouts if you become severely disabled. Payouts grow 2%→4% a year from 2026–2030; a claim made in 2026 starts around $689/month.',
      'From 2026, the MediSave outpatient-scan withdrawal limit doubles to $600/year, and Flexi-MediSave (for seniors 60+) rises to $400/year and later covers some restorative dental work.',
    ],
  },
  {
    id: 'mid-career-switch',
    title: 'Mid-career switch',
    icon: 'switch',
    blurb: 'Keeping CPF on track through income gaps, freelancing, or a career change.',
    sampleQuestions: [
      'How do CPF contributions work if I go self-employed?',
      'Can I top up my CPF for tax relief during a career break?',
    ],
    sources: [SOURCES.selfEmployed, SOURCES.topUps, SOURCES.matchingGrant],
    statements: [
      'As a self-employed person you must contribute to MediSave once net trade income exceeds $6,000/year; contributions to OA and SA remain voluntary.',
      'During lower-income periods you can make voluntary contributions to all three accounts to keep savings growing; total yearly contributions are capped by the CPF Annual Limit.',
      'Cash top-ups to your Special/Retirement Account (Retirement Sum Topping-Up Scheme) and to MediSave can qualify for tax relief, subject to conditions and caps.',
      'Lower-income members who top up their Retirement Account may receive a government match under the Matched Retirement Savings Scheme — up to $2,000/year, lifetime cap $20,000.',
    ],
  },
  {
    id: 'retirement',
    title: 'Retirement',
    icon: 'palm',
    blurb: 'How the Retirement Account, retirement sums and CPF LIFE turn savings into income.',
    sampleQuestions: [
      'How much can I withdraw from CPF at 55?',
      'Which CPF LIFE plan should I think about?',
    ],
    sources: [SOURCES.retirementSums, SOURCES.cpfLife],
    statements: [
      'At 55 your Special and Ordinary Account savings form a Retirement Account up to the Full Retirement Sum ($220,400 in 2026); you can withdraw at least $5,000, plus anything above your set-aside sum.',
      'CPF LIFE provides lifelong monthly payouts from your payout eligibility age (currently 65), funded by your Retirement Account.',
      'There are three CPF LIFE plans: Standard (level payouts), Basic (lower payouts, more left as bequest) and Escalating (payouts start lower and rise ~2%/year to offset inflation).',
      'You are placed on CPF LIFE if you have at least $60,000 in your Retirement Account at the payout age; deferring payouts up to age 70 increases them by up to ~7%/year.',
    ],
  },
]

const LIFE_EVENT_BY_ID = Object.fromEntries(LIFE_EVENTS.map((e) => [e.id, e]))

// ---------------------------------------------------------------------------
// Glossary — CPF's alphabet soup, expanded. Grouped so it's quick to scan.
// ---------------------------------------------------------------------------

export const GLOSSARY = [
  {
    group: 'Accounts',
    terms: [
      { abbr: 'CPF', full: 'Central Provident Fund', note: "Singapore's national savings scheme." },
      { abbr: 'OA', full: 'Ordinary Account', note: 'Housing, insurance, investment, education.' },
      { abbr: 'SA', full: 'Special Account', note: 'Retirement savings (before age 55).' },
      { abbr: 'MA', full: 'MediSave Account', note: 'Healthcare and approved medical insurance.' },
      { abbr: 'RA', full: 'Retirement Account', note: 'Formed at 55 to fund CPF LIFE payouts.' },
    ],
  },
  {
    group: 'Retirement',
    terms: [
      { abbr: 'BRS', full: 'Basic Retirement Sum', note: '$110,200 (2026). Lowest set-aside tier.' },
      { abbr: 'FRS', full: 'Full Retirement Sum', note: '$220,400 (2026). The default at 55.' },
      { abbr: 'ERS', full: 'Enhanced Retirement Sum', note: '$440,800 (2026). The maximum.' },
      { abbr: 'CPF LIFE', full: 'Lifelong Income For the Elderly', note: 'National annuity giving lifelong payouts.' },
      { abbr: 'MRSS', full: 'Matched Retirement Savings Scheme', note: 'Government matches RA top-ups.' },
      { abbr: 'RSTU', full: 'Retirement Sum Topping-Up Scheme', note: 'Top up SA/RA, often for tax relief.' },
    ],
  },
  {
    group: 'Healthcare',
    terms: [
      { abbr: 'BHS', full: 'Basic Healthcare Sum', note: 'MediSave cap — $79,000 (2026).' },
      { abbr: 'MediShield Life', full: 'MediShield Life', note: 'Basic lifelong health insurance.' },
      { abbr: 'CareShield Life', full: 'CareShield Life', note: 'Long-term-care disability insurance.' },
      { abbr: 'MMP', full: 'MediSave Maternity Package', note: 'Use MediSave for delivery costs.' },
      { abbr: 'MGN', full: 'MediSave Grant for Newborns', note: '$5,000 credited at birth.' },
    ],
  },
  {
    group: 'Housing',
    terms: [
      { abbr: 'BTO', full: 'Build-To-Order', note: 'New HDB flats built once demand is confirmed.' },
      { abbr: 'EHG', full: 'Enhanced CPF Housing Grant', note: 'Grant credited to your OA.' },
      { abbr: 'HPS', full: 'Home Protection Scheme', note: 'Mortgage-reducing insurance for HDB flats.' },
      { abbr: 'LTV', full: 'Loan-To-Value', note: 'Max share of price you can borrow (75% for HDB loan).' },
      { abbr: 'SDS', full: 'Staggered Downpayment Scheme', note: 'Pay the downpayment in two tranches.' },
      { abbr: 'MOP', full: 'Minimum Occupation Period', note: 'How long you must live in a flat before selling.' },
    ],
  },
  {
    group: 'Work & wages',
    terms: [
      { abbr: 'OW', full: 'Ordinary Wages', note: 'Monthly salary, capped at $8,000 (2026) for CPF.' },
      { abbr: 'AW', full: 'Additional Wages', note: 'Bonuses and other non-monthly pay.' },
      { abbr: 'NTI', full: 'Net Trade Income', note: 'Self-employed earnings; drives MediSave dues.' },
    ],
  },
]

// Build a compact, model-friendly context block from selected core sections and
// life events. Pass `{ sections, lifeEvents }`; both default to everything.
export function buildRulesContext({ sections = null, lifeEvents = null } = {}) {
  const coreKeys =
    sections ?? Object.keys(cpfRules).filter((k) => cpfRules[k] && cpfRules[k].statements)
  const eventIds = lifeEvents ?? LIFE_EVENTS.map((e) => e.id)

  const lines = [`CPF rules knowledge base (year ${cpfRules.year}, ${cpfRules.currency}):`]

  // NB: source URLs are deliberately NOT injected into the model context. The
  // app cites verified official links itself (see `collectSources`); keeping
  // URLs out of context means the model can't garble or hallucinate them.
  for (const key of coreKeys) {
    const section = cpfRules[key]
    if (!section?.statements) continue
    lines.push(`\n## ${section.label ?? key}`)
    for (const s of section.statements) lines.push(`- ${s}`)
  }

  for (const id of eventIds) {
    const ev = LIFE_EVENT_BY_ID[id]
    if (!ev) continue
    lines.push(`\n## Life event: ${ev.title}`)
    for (const s of ev.statements) lines.push(`- ${s}`)
  }

  return lines.join('\n')
}

// Collect the verified official source links for a selection (the object
// returned by `selectRelevantSections`). Returns a deduped, ordered list of
// `{ label, url }` — exactly what the UI renders as citations. Because the URLs
// come from the curated `SOURCES` registry (not the model), every link is real.
export function collectSources({ sections = [], lifeEvents = [] } = {}) {
  const urls = []
  for (const key of sections) {
    const url = cpfRules[key]?.source
    if (url) urls.push(url)
  }
  for (const id of lifeEvents) {
    const ev = LIFE_EVENT_BY_ID[id]
    if (ev?.sources) urls.push(...ev.sources)
  }
  const seen = new Set()
  const result = []
  for (const url of urls) {
    if (seen.has(url)) continue
    seen.add(url)
    let label = SOURCE_LABELS[url]
    if (!label) {
      try {
        label = new URL(url).hostname.replace(/^www\./, '')
      } catch {
        label = url
      }
    }
    result.push({ label, url })
  }
  return result
}

// Keyword router: pick the core sections and life events most relevant to a
// question so the context stays focused. Returns { sections, lifeEvents }.
export function selectRelevantSections(question = '') {
  const q = question.toLowerCase()
  const sections = new Set(['retirementSums'])
  const events = new Set()
  const addS = (...k) => k.forEach((x) => sections.add(x))
  const addE = (...k) => k.forEach((x) => events.add(x))

  if (/interest|grow|return|compound/.test(q)) addS('interestRates')
  if (/contribut|salary|wage|income|employer|ceiling|start|first job|nominat/.test(q)) {
    addS('contributionRates', 'wageCeilings', 'allocation')
    addE('starting-work')
  }
  if (/home|house|hdb|property|mortgage|downpayment|grant|accrued/.test(q)) addE('buying-a-home')
  if (/bto|flat|income ceiling|ehg|housing grant|downpayment|prime|plus flat/.test(q)) addE('buying-a-bto')
  if (/marri|spouse|wedding|partner/.test(q)) addE('getting-married')
  if (/child|kid|baby|newborn|maternity|pregnan|parent/.test(q)) addE('having-kids')
  if (/medisave|ma\b|health|medical|medishield|careshield|bhs|hospital|insur/.test(q)) {
    addS('bhs', 'accountStructure')
    addE('healthcare')
  }
  if (/self-employ|freelance|career|switch|gig|top.?up|voluntary|tax relief/.test(q)) {
    addE('mid-career-switch')
  }
  if (/retire|withdraw|cpf life|payout|55|65|annuity/.test(q)) {
    addS('withdrawals', 'accountStructure')
    addE('retirement')
  }
  if (/account|oa\b|sa\b|special|ordinary|transfer/.test(q)) addS('accountStructure')

  // Always give a base of withdrawals context for retirement-flavoured queries.
  if (events.size === 0 && sections.size === 1) addS('withdrawals', 'accountStructure')

  return { sections: [...sections], lifeEvents: [...events] }
}
