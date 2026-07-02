import { useEffect, useRef, useState } from 'react'
import BalanceInput from './components/BalanceInput.jsx'
import FileUpload from './components/FileUpload.jsx'
import ProjectionPanel from './components/ProjectionPanel.jsx'
import LifeEvents from './components/LifeEvents.jsx'
import ChatInterface from './components/ChatInterface.jsx'
import Glossary from './components/Glossary.jsx'
import Icon from './components/icons.jsx'
import './App.css'

const EMPTY_PROFILE = { oa: '', sa: '', ma: '', age: '', income: '' }
const STORAGE_KEY = 'cpf-planner:profile'

function App() {
  // Raw profile — lives only in component state (and optionally localStorage if
  // the user opts in). It is never sent anywhere in raw form.
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...EMPTY_PROFILE, ...JSON.parse(saved) } : EMPTY_PROFILE
    } catch {
      return EMPTY_PROFILE
    }
  })
  const [remember, setRemember] = useState(() => !!localStorage.getItem(STORAGE_KEY))
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('cpf-planner:key') ?? '')
  // A parsed statement the user chose to attach to the chat. Held raw in memory
  // only; ChatInterface sanitises it into bands before any request goes out.
  const [attachedDoc, setAttachedDoc] = useState(null)
  const chatRef = useRef(null)

  useEffect(() => {
    if (remember) localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    else localStorage.removeItem(STORAGE_KEY)
  }, [profile, remember])

  function handleApiKey(key) {
    setApiKey(key)
    if (key) sessionStorage.setItem('cpf-planner:key', key)
    else sessionStorage.removeItem('cpf-planner:key')
  }

  // Copy parsed statement figures into the balance form. RA has no form field;
  // it is preserved on the attached document for the chat instead.
  function fillProfileFromDoc(doc) {
    const { oa, sa, ma } = doc.accounts
    setProfile((p) => ({
      ...p,
      oa: oa != null ? String(oa) : p.oa,
      sa: sa != null ? String(sa) : p.sa,
      ma: ma != null ? String(ma) : p.ma,
      age: doc.age != null ? String(doc.age) : p.age,
      income: doc.income != null ? String(doc.income) : p.income,
    }))
  }

  function askAssistant(question) {
    document.getElementById('assistant')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    chatRef.current?.ask(question)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">CPF</span>
          <span className="brand-name">Planner</span>
        </div>
        <h1>Plan your CPF with clarity — and keep your numbers to yourself.</h1>
        <p className="intro">
          Enter your balances, see how they could grow, and ask plain-English questions about
          housing, family, healthcare and retirement.
        </p>
        <div className="privacy-note">
          <Icon name="lock" size={16} />
          <span>
            Your exact balances stay in this browser. The assistant only ever receives anonymised
            ranges (e.g. “$100k–$150k”), never the precise amount.
          </span>
        </div>
      </header>

      <main className="layout">
        <div className="col-left">
          <BalanceInput
            profile={profile}
            onChange={setProfile}
            remember={remember}
            onRememberChange={setRemember}
          />
          <FileUpload
            onFillProfile={fillProfileFromDoc}
            onAttach={setAttachedDoc}
            attached={!!attachedDoc}
            apiKey={apiKey}
          />
          <ProjectionPanel profile={profile} />
          <Glossary />
        </div>
        <div className="col-right">
          <LifeEvents onAsk={askAssistant} />
          <ChatInterface
            ref={chatRef}
            profile={profile}
            attachedDoc={attachedDoc}
            onClearAttachedDoc={() => setAttachedDoc(null)}
            apiKey={apiKey}
            onApiKeyChange={handleApiKey}
          />
        </div>
      </main>

      <footer className="app-footer">
        <p>
          General information based on published CPF figures for 2026 — not financial advice. Always
          confirm details at <a href="https://www.cpf.gov.sg">cpf.gov.sg</a>.
        </p>
      </footer>
    </div>
  )
}

export default App
