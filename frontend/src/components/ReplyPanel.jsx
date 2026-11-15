import { useEffect, useState } from 'react'

const TONES = [
  ['professional', 'Professional'],
  ['friendly', 'Friendly'],
  ['concise', 'Concise'],
  ['formal', 'Formal'],
]

function senderName(from = '') {
  return from.replace(/<.*?>/g, '').replace(/"/g, '').trim() || from
}

function formatDate(value) {
  const d = new Date(value)
  return isNaN(d) ? value : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

async function api(path, options = {}) {
  let res
  try {
    res = await fetch(path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }
  let data = null
  try { data = await res.json() } catch { /* non-JSON */ }
  if (res.status === 401) throw new Error('Your session has expired. Sign out and sign in again.')
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
  return data
}

export default function ReplyPanel({ email, onBack }) {
  const [full, setFull] = useState(null)
  const [loadingMail, setLoadingMail] = useState(true)
  const [mailError, setMailError] = useState('')
  const [expanded, setExpanded] = useState(false)

  const [tone, setTone] = useState('professional')
  const [draft, setDraft] = useState('')
  const [to, setTo] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)

  // Load the full message
  useEffect(() => {
    let cancelled = false
    setFull(null)
    setMailError('')
    setLoadingMail(true)
    api(`/emails/${email.id}`)
      .then((d) => { if (!cancelled) setFull(d) })
      .catch((err) => { if (!cancelled) setMailError(err.message) })
      .finally(() => { if (!cancelled) setLoadingMail(false) })
    return () => { cancelled = true }
  }, [email.id])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  async function generate() {
    setGenerating(true)
    try {
      const d = await api(`/emails/${email.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ send: false, tone }),
      })
      setDraft(d.reply)
      setTo(d.to)
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    } finally {
      setGenerating(false)
    }
  }

  async function send() {
    if (!draft.trim()) return
    if (!window.confirm(`Send this reply to ${to || senderName(email.from)}?`)) return
    setSending(true)
    try {
      await api(`/emails/${email.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ send: true, reply: draft, tone }),
      })
      setToast({ type: 'success', text: 'Reply sent successfully.' })
      setDraft('')
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    } finally {
      setSending(false)
    }
  }

  const body = full?.body?.trim()

  return (
    <section className="reply-panel">
      <div className="reply-panel-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h3>{email.subject || '(no subject)'}</h3>
      </div>

      <div className="reply-panel-body">
        {/* ---------- Received email ---------- */}
        <div className="email-view">
          <div className="email-view-head">
            <span>From <strong>{full?.from || email.from}</strong></span>
            {full?.date && <span>{formatDate(full.date)}</span>}
          </div>

          {loadingMail ? (
            <div className="email-view-body muted">Loading message…</div>
          ) : mailError ? (
            <div className="email-view-body muted">{mailError}</div>
          ) : (
            <div className={`email-view-body ${expanded ? 'expanded' : ''} ${body ? '' : 'muted'}`}>
              {body || email.snippet || 'This message has no readable text content.'}
            </div>
          )}

          {body && body.length > 600 && (
            <button className="email-view-toggle" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Show less' : 'Show full message'}
            </button>
          )}
        </div>

        {/* ---------- Tone ---------- */}
        <div className="tone-section">
          <label>Tone</label>
          <div className="tone-pills">
            {TONES.map(([value, label]) => (
              <button
                key={value}
                className={`tone-pill ${tone === value ? 'active' : ''}`}
                onClick={() => setTone(value)}
                disabled={generating || sending}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          className={`generate-btn ${generating ? 'loading' : ''}`}
          onClick={generate}
          disabled={generating || sending}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
          </svg>
          {generating ? 'Generating…' : draft ? 'Regenerate reply' : 'Generate reply'}
        </button>

        {/* ---------- Draft ---------- */}
        <div className="draft-section">
          <label htmlFor="draft">Your reply</label>
          <textarea
            id="draft"
            className="draft-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={generating}
            placeholder={generating ? 'Drafting your reply…' : 'Click “Generate reply”, then edit the draft here before sending.'}
          />
        </div>
      </div>

      <div className="reply-panel-footer">
        {generating ? (
          <div className="status-message loading"><span className="spinner" /> Drafting…</div>
        ) : to ? (
          <div className="reply-meta-item">To: <strong>{to}</strong></div>
        ) : <span />}

        <button className="send-btn" onClick={send} disabled={!draft.trim() || generating || sending}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4z" />
            <path d="M22 2 11 13" />
          </svg>
          {sending ? 'Sending…' : 'Send reply'}
        </button>
      </div>

      {toast && <div className={`toast ${toast.type}`} role="status"><span>{toast.text}</span></div>}
    </section>
  )
}