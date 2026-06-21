import { useState } from 'react'
import Icon from './icons.jsx'
import { LIFE_EVENTS } from '../data/cpfRules.js'

// Explore CPF by life stage. Each card opens to plain-language facts (straight
// from the knowledge base) and question chips that hand a question to the
// assistant — so it's obvious what you can ask and why it's relevant.

export default function LifeEvents({ onAsk }) {
  const [openId, setOpenId] = useState(null)
  const open = LIFE_EVENTS.find((e) => e.id === openId)

  return (
    <section className="card life-events">
      <div className="section-head">
        <h2>Explore by life stage</h2>
        <p className="lede">
          CPF touches each chapter of life differently. Pick where you are — see the key facts,
          then ask the assistant anything.
        </p>
      </div>

      <div className="event-grid">
        {LIFE_EVENTS.map((ev) => {
          const active = ev.id === openId
          return (
            <button
              key={ev.id}
              className={`event-card${active ? ' active' : ''}`}
              onClick={() => setOpenId(active ? null : ev.id)}
              aria-expanded={active}
            >
              <span className="event-icon">
                <Icon name={ev.icon} />
              </span>
              <span className="event-title">{ev.title}</span>
              <span className="event-blurb">{ev.blurb}</span>
            </button>
          )
        })}
      </div>

      {open && (
        <div className="event-detail">
          <div className="event-detail-head">
            <Icon name={open.icon} size={20} />
            <h3>{open.title}</h3>
          </div>
          <ul className="facts">
            {open.statements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <div className="ask-row">
            <span className="ask-label">Ask the assistant:</span>
            {open.sampleQuestions.map((q) => (
              <button key={q} className="chip" onClick={() => onAsk(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
