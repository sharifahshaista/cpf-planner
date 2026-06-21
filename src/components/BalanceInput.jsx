import { useState } from 'react'

// Controlled form for the user's CPF position. Raw values are lifted to App via
// onChange and otherwise stay in the browser. "Remember on this device" is opt-in
// and uses localStorage; by default nothing is persisted.

const FIELDS = [
  { key: 'oa', label: 'Ordinary Account (OA)', placeholder: 'e.g. 80000' },
  { key: 'sa', label: 'Special Account (SA)', placeholder: 'e.g. 60000' },
  { key: 'ma', label: 'MediSave Account (MA)', placeholder: 'e.g. 40000' },
  { key: 'age', label: 'Age', placeholder: 'e.g. 42', integer: true },
  { key: 'income', label: 'Monthly income (optional)', placeholder: 'e.g. 6000' },
]

export default function BalanceInput({ profile, onChange, remember, onRememberChange }) {
  const [errors, setErrors] = useState({})

  function handleField(key, value) {
    const cleaned = value.replace(/[^0-9.]/g, '')
    const next = { ...profile, [key]: cleaned }
    const nextErrors = { ...errors }
    if (cleaned !== '' && Number(cleaned) < 0) nextErrors[key] = 'Must be positive'
    else delete nextErrors[key]
    setErrors(nextErrors)
    onChange(next)
  }

  return (
    <form className="card balance-input" onSubmit={(e) => e.preventDefault()}>
      <div className="section-head">
        <h2>Your CPF position</h2>
        <p className="lede">
          Enter what you have today. These figures stay in your browser — only ranges are ever sent.
        </p>
      </div>
      <div className="fields">
        {FIELDS.map((f) => (
          <label key={f.key} className="field">
            <span>{f.label}</span>
            <input
              type="text"
              inputMode={f.integer ? 'numeric' : 'decimal'}
              placeholder={f.placeholder}
              value={profile[f.key] ?? ''}
              onChange={(e) => handleField(f.key, e.target.value)}
            />
            {errors[f.key] && <small className="error">{errors[f.key]}</small>}
          </label>
        ))}
      </div>
      <label className="remember">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => onRememberChange(e.target.checked)}
        />
        <span>Remember on this device (saves to localStorage)</span>
      </label>
    </form>
  )
}
