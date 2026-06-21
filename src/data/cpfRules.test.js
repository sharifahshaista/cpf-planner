import { describe, it, expect } from 'vitest'
import {
  SOURCES,
  SOURCE_LABELS,
  collectSources,
  selectRelevantSections,
  LIFE_EVENTS,
  cpfRules,
} from './cpfRules.js'

const OFFICIAL_DOMAINS = ['cpf.gov.sg', 'hdb.gov.sg', 'moh.gov.sg']
const ALL_URLS = new Set(Object.values(SOURCES))

const isOfficialHttps = (url) => {
  let u
  try {
    u = new URL(url)
  } catch {
    return false
  }
  if (u.protocol !== 'https:') return false
  const host = u.hostname.replace(/^www\./, '')
  return OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith('.' + d))
}

describe('SOURCES registry', () => {
  it('contains only HTTPS official-domain URLs', () => {
    for (const url of Object.values(SOURCES)) {
      expect(isOfficialHttps(url), url).toBe(true)
    }
  })

  it('has a friendly label for every URL', () => {
    for (const url of Object.values(SOURCES)) {
      expect(SOURCE_LABELS[url], url).toBeTruthy()
    }
  })

  it('is referenced only by valid keys across the KB', () => {
    // Every section.source and life-event source must be a known SOURCES URL.
    for (const section of Object.values(cpfRules)) {
      if (section && typeof section === 'object' && section.source) {
        expect(ALL_URLS.has(section.source), section.source).toBe(true)
      }
    }
    for (const ev of LIFE_EVENTS) {
      for (const url of ev.sources ?? []) {
        expect(ALL_URLS.has(url), `${ev.id}: ${url}`).toBe(true)
      }
    }
  })
})

describe('collectSources', () => {
  it('returns deduped {label,url} drawn only from SOURCES', () => {
    const selection = selectRelevantSections('How much of my BTO downpayment can I pay with CPF?')
    const sources = collectSources(selection)
    expect(sources.length).toBeGreaterThan(0)
    const urls = sources.map((s) => s.url)
    expect(new Set(urls).size).toBe(urls.length) // no duplicates
    for (const s of sources) {
      expect(ALL_URLS.has(s.url), s.url).toBe(true)
      expect(s.label).toBeTruthy()
    }
  })

  it('includes the housing-grant source for a BTO question', () => {
    const selection = selectRelevantSections('Am I eligible for the Enhanced CPF Housing Grant?')
    const urls = collectSources(selection).map((s) => s.url)
    expect(urls).toContain(SOURCES.housingGrant)
  })

  it('handles an empty selection', () => {
    expect(collectSources({ sections: [], lifeEvents: [] })).toEqual([])
    expect(collectSources()).toEqual([])
  })
})
