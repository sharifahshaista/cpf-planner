import { useRef, useState } from 'react'
import Icon from './icons.jsx'
import { parseCpfPdf } from '../utils/claudeParser.js'

// Upload a CPF statement PDF. A Claude parsing agent reads the PDF and extracts
// the CPF figures into JSON. The extracted figures are shown to the user so they
// can review and either fill their profile or attach a sanitised (banded) summary
// to the chat. NOTE: parsing sends the raw PDF to Anthropic — see claudeParser.js.

const money = (n) =>
  n == null ? '—' : n.toLocaleString('en-SG', { style: 'currency', currency: 'SGD' })

export default function FileUpload({ onFillProfile, onAttach, attached, apiKey }) {
  const [status, setStatus] = useState('idle') // idle | parsing | done | error
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null) // { document, meta }
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  async function handleFile(file) {
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setStatus('error')
      setError('Please choose a PDF file.')
      return
    }
    if (!apiKey) {
      setStatus('error')
      setError('Add your Anthropic API key in the assistant panel below to parse a statement.')
      return
    }
    setStatus('parsing')
    setError(null)
    setResult(null)
    try {
      const parsed = await parseCpfPdf(file, apiKey)
      setResult(parsed)
      setStatus(parsed.document.confidence === 'none' ? 'error' : 'done')
      if (parsed.document.confidence === 'none') {
        setError('No CPF balances could be read from this PDF. Try another file or enter figures manually.')
      }
    } catch (e) {
      setStatus('error')
      setError(e?.message || 'Could not read this PDF.')
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  function reset() {
    setStatus('idle')
    setError(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const doc = result?.document
  const acc = doc?.accounts

  return (
    <section className="card upload">
      <div className="section-head">
        <h2>Upload a CPF statement</h2>
        <p className="lede">
          A Claude parsing agent reads your statement PDF and pulls out the figures automatically.
          Parsing sends the PDF to Anthropic; the assistant chat still only ever receives anonymised
          ranges.
        </p>
      </div>

      {status !== 'done' && (
        <label
          className={`dropzone ${dragging ? 'dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Icon name="upload" size={22} />
          <span>{status === 'parsing' ? 'Reading your statement…' : 'Drop a PDF here or click to choose'}</span>
        </label>
      )}

      {error && <p className="error">{error}</p>}

      {status === 'done' && doc && (
        <div className="parsed">
          <div className="parsed-head">
            <span className="parsed-file">
              <Icon name="file" size={14} /> {result.meta.fileName || 'statement.pdf'}
            </span>
            <button className="link" onClick={reset}>
              Choose another
            </button>
          </div>

          <table className="parsed-figures">
            <tbody>
              <tr>
                <td>Ordinary Account</td>
                <td>{money(acc.oa)}</td>
              </tr>
              <tr>
                <td>Special Account</td>
                <td>{money(acc.sa)}</td>
              </tr>
              <tr>
                <td>MediSave Account</td>
                <td>{money(acc.ma)}</td>
              </tr>
              {acc.ra != null && (
                <tr>
                  <td>Retirement Account</td>
                  <td>{money(acc.ra)}</td>
                </tr>
              )}
              <tr className="parsed-total">
                <td>Total</td>
                <td>{money(doc.totalBalance)}</td>
              </tr>
              {doc.income != null && (
                <tr>
                  <td>Monthly wage</td>
                  <td>{money(doc.income)}</td>
                </tr>
              )}
              {doc.age != null && (
                <tr>
                  <td>Age</td>
                  <td>{doc.age}</td>
                </tr>
              )}
              {doc.statementDate && (
                <tr>
                  <td>Statement date</td>
                  <td>{doc.statementDate}</td>
                </tr>
              )}
              {doc.contributionCount > 0 && (
                <tr>
                  <td>Contribution entries</td>
                  <td>{doc.contributionCount}</td>
                </tr>
              )}
            </tbody>
          </table>

          {doc.confidence === 'partial' && doc.warnings.length > 0 && (
            <p className="muted warn">
              Some figures weren’t found ({doc.warnings.join(', ')}). Please review and edit as needed.
            </p>
          )}

          <div className="parsed-actions">
            <button className="primary" onClick={() => onFillProfile(doc)}>
              Fill my figures
            </button>
            <button className="secondary" onClick={() => onAttach(doc)} disabled={attached}>
              {attached ? (
                <>
                  <Icon name="check" size={14} /> Attached to chat
                </>
              ) : (
                'Attach to chat (as ranges)'
              )}
            </button>
          </div>
          <p className="muted">
            “Fill my figures” copies the numbers into the form above (they stay in your browser).
            “Attach to chat” sends the assistant only anonymised ranges — never the exact figures.
          </p>
        </div>
      )}
    </section>
  )
}
