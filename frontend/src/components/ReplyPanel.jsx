import { useState } from 'react'

const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'casual', label: 'Casual' },
  { id: 'formal', label: 'Formal' },
  { id: 'concise', label: 'Concise' },
]

export default function ReplyPanel({ email, onBack }) {
  const [tone, setTone] = useState('professional')
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    setStatus({ type: 'loading', message: 'AI is crafting your reply...' })
    try {
      const res = await fetch(`/emails/${email.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone, send: false }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate reply')
      setDraft(data.reply)
      setStatus({ type: 'success', message: 'Draft generated successfully!' })
      setTimeout(() => setStatus({ type: '', message: '' }), 3000)
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setGenerating(false)
    }
  }

  const handleSend = async () => {
    if (!draft.trim()) {
      setStatus({ type: 'error', message: 'Please write or generate a reply first' })
      return
    }
    if (!window.confirm('Send this reply?')) return

    setSending(true)
    setStatus({ type: 'loading', message: 'Sending your reply...' })
    try {
      const res = await fetch(`/emails/${email.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ send: true, reply: draft }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setStatus({ type: 'success', message: 'Reply sent successfully! ✓' })
      setDraft('')
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setSending(false)
    }
  }

  const senderName = email.from.replace(/<.*>/, '').trim().replace(/"/g, '')

  return (
    <div className="reply-panel">
      {/* Header */}
      <div className="reply-panel-header">
        <button className="back-btn" onClick={onBack}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <h3>Re: {email.subject || '(No subject)'}</h3>
        <div className="reply-meta">
          <div className="reply-meta-item">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
            </svg>
            <span>From: <strong>{senderName}</strong></span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="reply-panel-body">
        {/* Tone Selector */}
        <div className="tone-section">
          <label>Reply Tone</label>
          <div className="tone-pills">
            {TONES.map(t => (
              <button
                key={t.id}
                className={`tone-pill ${tone === t.id ? 'active' : ''}`}
                onClick={() => setTone(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          className={`generate-btn ${generating ? 'loading' : ''}`}
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              Generate AI Reply
            </>
          )}
        </button>

        {/* Draft Textarea */}
        <div className="draft-section">
          <label>Your Reply</label>
          <textarea
            className="draft-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Click 'Generate AI Reply' to get a smart draft, or type your own reply here..."
          />
        </div>
      </div>

      {/* Footer */}
      <div className="reply-panel-footer">
        {status.message ? (
          <div className={`status-message ${status.type}`}>
            {status.type === 'loading' && <div className="spinner" />}
            {status.type === 'success' && (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {status.type === 'error' && (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
            {status.message}
          </div>
        ) : <div />}

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!draft.trim() || sending}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
          {sending ? 'Sending...' : 'Send Reply'}
        </button>
      </div>
    </div>
  )
}

