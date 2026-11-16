import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import { DEMO_EMAILS } from '../demoData'

const TONES = [
  ['professional', 'Professional'],
  ['friendly', 'Friendly'],
  ['concise', 'Concise'],
  ['formal', 'Formal'],
]

const EMPTY_CUSTOM = { from: '', subject: '', body: '' }

function senderName(from = '') {
  return from.replace(/<.*?>/g, '').replace(/"/g, '').trim() || from
}

function avatarColor(text = '') {
  let h = 0
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return `var(--avatar-${(h % 7) + 1})`
}

function gmailLink(email, reply) {
  const match = (email.from || '').match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
  const subject = email.subject
    ? /^re:/i.test(email.subject) ? email.subject : `Re: ${email.subject}`
    : ''
  const q = (k, v) => `${k}=${encodeURIComponent(v)}`
  return `https://mail.google.com/mail/?view=cm&fs=1&${q('to', match ? match[0] : '')}&${q('su', subject)}&${q('body', reply)}`
}

export default function DemoApp({ onExit }) {
  const [selected, setSelected] = useState(DEMO_EMAILS[0].id) // sample id, 'custom', or null
  const [custom, setCustom] = useState(EMPTY_CUSTOM)
  const [tone, setTone] = useState('professional')
  const [name, setName] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const isCustom = selected === 'custom'
  const current = isCustom ? custom : DEMO_EMAILS.find((e) => e.id === selected)

  function choose(id) {
    setSelected(id)
    setReply('')
    setError('')
  }

  async function generate() {
    if (!current?.body?.trim()) {
      setError('Paste an email first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/demo/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: current.from,
          subject: current.subject,
          body: current.body,
          tone,
          name,
        }),
      })
      let data = null
      try { data = await res.json() } catch { /* non-JSON */ }
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
      setReply(data.reply)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(reply)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copy failed. Select the text and copy it manually.')
    }
  }

  const hasReply = reply.trim().length > 0

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="header-logo">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <span className="header-brand">ReplyWise</span>
          <span className="header-badge">Demo</span>
        </div>
        <div className="header-right">
          <ThemeToggle />
          <a className="demo-link" href="/auth/login">Connect Gmail</a>
          <button className="demo-link" onClick={onExit}>Exit demo</button>
        </div>
      </header>

      <div className={`dashboard ${selected ? 'has-selected' : ''}`}>
        <aside className="email-list-container">
          <div className="email-list-header">
            <h2>Sample inbox</h2>
            <span className="email-count">Pick an email, or paste your own</span>
          </div>
          <div className="email-list-scroll">
            <div
              role="button"
              tabIndex={0}
              className={`email-card ${isCustom ? 'selected' : ''}`}
              onClick={() => choose('custom')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && choose('custom')}
            >
              <div className="email-avatar" style={{ background: 'var(--accent)' }}>+</div>
              <div className="email-card-content">
                <div className="email-subject">Paste your own email</div>
                <div className="email-snippet">Try it on a real message</div>
              </div>
            </div>

            {DEMO_EMAILS.map((e) => (
              <div
                key={e.id}
                role="button"
                tabIndex={0}
                className={`email-card ${selected === e.id ? 'selected' : ''}`}
                onClick={() => choose(e.id)}
                onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && choose(e.id)}
              >
                <div className="email-avatar" style={{ background: avatarColor(senderName(e.from)) }}>
                  {senderName(e.from)[0]}
                </div>
                <div className="email-card-content">
                  <div className="email-card-top">
                    <span className="email-sender">{senderName(e.from)}</span>
                  </div>
                  <div className="email-subject">{e.subject}</div>
                  <div className="email-snippet">{e.snippet}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {!current ? (
          <section className="reply-panel is-empty">
            <div className="empty-state">
              <h3>Select an email</h3>
              <p>Pick a sample email, or paste your own, to generate a reply.</p>
            </div>
          </section>
        ) : (
          <section className="reply-panel" key={selected}>
            <div className="reply-panel-header">
              <button className="back-btn" onClick={() => setSelected(null)}>← Back</button>
              <h3>{isCustom ? 'Paste an email' : current.subject}</h3>
            </div>

            <div className="reply-panel-body">
              {isCustom ? (
                <>
                  <div className="demo-grid">
                    <input
                      className="demo-input"
                      placeholder="From (optional), e.g. Priya <priya@company.com>"
                      value={custom.from}
                      onChange={(e) => setCustom({ ...custom, from: e.target.value })}
                    />
                    <input
                      className="demo-input"
                      placeholder="Subject (optional)"
                      value={custom.subject}
                      onChange={(e) => setCustom({ ...custom, subject: e.target.value })}
                    />
                  </div>
                  <textarea
                    className="draft-textarea"
                    style={{ minHeight: 160, flex: 'none' }}
                    placeholder="Paste the email you received here…"
                    value={custom.body}
                    onChange={(e) => setCustom({ ...custom, body: e.target.value })}
                  />
                </>
              ) : (
                <div className="email-view">
                  <div className="email-view-head">
                    <span>From <strong>{current.from}</strong></span>
                  </div>
                  <div className="email-view-body">{current.body}</div>
                </div>
              )}

              <div className="tone-section">
                <label>Tone</label>
                <div className="tone-pills">
                  {TONES.map(([value, label]) => (
                    <button
                      key={value}
                      className={`tone-pill ${tone === value ? 'active' : ''}`}
                      onClick={() => setTone(value)}
                      disabled={loading}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <input
                className="demo-input"
                placeholder="Your name for the signature (optional)"
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <button
                className={`generate-btn ${loading ? 'loading' : ''}`}
                onClick={generate}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
                </svg>
                {loading ? 'Generating…' : hasReply ? 'Regenerate reply' : 'Generate reply'}
              </button>

              {error && <p className="status-message error">{error}</p>}

              <div className="draft-section">
                <label htmlFor="demo-reply">Generated reply</label>
                <textarea
                  id="demo-reply"
                  className="draft-textarea"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Your AI-drafted reply will appear here. You can edit it."
                />
              </div>
            </div>

            <div className="reply-panel-footer">
              <span className="demo-note">
                Up to 10 AI replies per day per visitor. Nothing is saved on our server;
                the text is sent to Cohere to write the draft.
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="demo-link" onClick={copy} disabled={!hasReply}>
                  {copied ? 'Copied' : 'Copy reply'}
                </button>
                <a
                  className="demo-link"
                  href={hasReply ? gmailLink(current, reply) : undefined}
                  target="_blank"
                  rel="noreferrer"
                  style={{ opacity: hasReply ? 1 : 0.5, pointerEvents: hasReply ? 'auto' : 'none' }}
                >
                  Open in Gmail
                </a>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}