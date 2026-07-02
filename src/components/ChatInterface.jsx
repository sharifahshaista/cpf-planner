import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Icon from './icons.jsx'
import { sanitiseProfile, sanitiseDocument } from '../utils/sanitiser.js'
import { askCPF } from '../utils/claudeClient.js'

// Chat with Claude over the SANITISED profile. The API key lives in sessionStorage
// (cleared when the tab closes). A "what was sent" panel reveals the exact
// anonymised payload — the proof that exact figures never leave the browser.

const STARTERS = [
  'Can I withdraw from my CPF at 55?',
  'Am I on track to hit the Full Retirement Sum?',
  'How does CPF interest grow my balances?',
]

const ChatInterface = forwardRef(function ChatInterface(
  { profile, attachedDoc, onClearAttachedDoc, apiKey, onApiKeyChange },
  ref,
) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [keyDraft, setKeyDraft] = useState('')
  const [showPayloadFor, setShowPayloadFor] = useState(null)
  const endRef = useRef(null)

  async function send(question) {
    const q = (question ?? input).trim()
    if (!q || loading) return
    if (!apiKey) {
      setInput(q)
      setError('Add your Anthropic API key below to start asking.')
      return
    }
    setError(null)
    setInput('')
    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    setMessages((m) => [...m, { role: 'user', content: q }])
    setLoading(true)
    try {
      const sanitised = sanitiseProfile(profile)
      // Attached statement is banded (and PII-stripped) here, before it can reach
      // the request — same privacy contract as the profile.
      const sanitisedDocument = attachedDoc ? sanitiseDocument(attachedDoc) : null
      const { text, sources, sentPayload } = await askCPF({
        apiKey,
        sanitisedProfile: sanitised,
        sanitisedDocument,
        rawProfile: profile,
        question: q,
        history,
      })
      setMessages((m) => [...m, { role: 'assistant', content: text, sources, sentPayload }])
    } catch (e) {
      setError(e.message || 'Request failed.')
    } finally {
      setLoading(false)
    }
  }

  function clearChat() {
    setMessages([])
    setInput('')
    setError(null)
    setShowPayloadFor(null)
  }

  // A life-stage card can hand us a question via this imperative method —
  // event-driven, so no setState-in-effect.
  useImperativeHandle(ref, () => ({
    ask(question) {
      if (apiKey) send(question)
      else {
        setInput(question)
        setError('Add your Anthropic API key below to ask this.')
      }
    },
  }))

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, loading])

  return (
    <section className="card chat" id="assistant">
      <div className="section-head chat-head">
        <div>
          <h2>Ask the assistant</h2>
          <p className="lede">
            Powered by Claude. It only ever sees your balances as ranges — never the exact figures.
          </p>
        </div>
        {messages.length > 0 && (
          <button className="link new-chat" onClick={clearChat} disabled={loading}>
            <Icon name="refresh" size={14} />
            New chat
          </button>
        )}
      </div>

      {attachedDoc && (
        <div className="attached-doc">
          <span>
            <Icon name="file" size={13} /> Statement attached — sent as anonymised ranges only.
          </span>
          <button className="link" onClick={onClearAttachedDoc}>
            Remove
          </button>
        </div>
      )}

      <div className="messages">
        {messages.length === 0 && (
          <div className="starter">
            <p className="muted">Try a question:</p>
            <div className="chips">
              {STARTERS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)} disabled={loading}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="bubble">
              {m.role === 'assistant' ? (
                <div className="markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
            {m.sources?.length > 0 && (
              <div className="sources">
                <span className="sources-label">Official sources</span>
                <ul>
                  {m.sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {m.sentPayload && (
              <div className="transparency">
                <button
                  className="link"
                  onClick={() => setShowPayloadFor(showPayloadFor === i ? null : i)}
                >
                  <Icon name="lock" size={13} />
                  {showPayloadFor === i ? 'Hide what was sent' : 'See exactly what was sent'}
                </button>
                {showPayloadFor === i && (
                  <pre className="payload">{JSON.stringify(m.sentPayload, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="msg assistant">
            <div className="bubble typing">Thinking…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="error">{error}</p>}

      <div className="composer">
        <input
          type="text"
          placeholder="Ask a CPF question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={loading}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>

      {!apiKey ? (
        <div className="key-entry">
          <label htmlFor="api-key">Your Anthropic API key</label>
          <div className="key-row">
            <input
              id="api-key"
              type="password"
              placeholder="sk-ant-…"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
            />
            <button onClick={() => onApiKeyChange(keyDraft.trim())} disabled={!keyDraft.trim()}>
              Save
            </button>
          </div>
          <p className="muted">Stored in this browser tab only and cleared when you close it.</p>
        </div>
      ) : (
        <button className="link clear-key" onClick={() => onApiKeyChange('')}>
          Clear API key
        </button>
      )}
    </section>
  )
})

export default ChatInterface
