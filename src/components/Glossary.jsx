import { useState } from 'react'
import { GLOSSARY } from '../data/cpfRules.js'

// Jargon buster. CPF runs on acronyms — this keeps their meanings one glance
// away. Collapsible so it stays out of the way until needed.

export default function Glossary() {
  const [open, setOpen] = useState(false)

  return (
    <section className="card glossary">
      <button className="glossary-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="section-head no-margin">
          <h2>Jargon buster</h2>
          <p className="lede">What all those CPF abbreviations actually mean.</p>
        </div>
        <span className={`chevron${open ? ' up' : ''}`} aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div className="glossary-body">
          {GLOSSARY.map((g) => (
            <div key={g.group} className="glossary-group">
              <h3>{g.group}</h3>
              <dl>
                {g.terms.map((t) => (
                  <div key={t.abbr} className="term">
                    <dt>
                      <span className="abbr">{t.abbr}</span>
                      <span className="full">{t.full}</span>
                    </dt>
                    {t.note && <dd>{t.note}</dd>}
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
