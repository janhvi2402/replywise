import { useState, useEffect, useCallback } from 'react'
import Header from './Header'
import EmailList from './EmailList'
import ReplyPanel from './ReplyPanel'

export default function Dashboard({ onLogout }) {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedEmail, setSelectedEmail] = useState(null)

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/emails/')
      if (res.status === 401) {
        onLogout()
        return
      }
      if (!res.ok) throw new Error('Failed to load emails')
      const data = await res.json()
      setEmails(data.emails || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  const handleSelectEmail = (email) => {
    setSelectedEmail(email)
  }

  return (
    <div className="app-shell">
      <Header onLogout={onLogout} />
      <div className={`dashboard ${selectedEmail ? 'has-selected' : ''}`}>
        <EmailList
          emails={emails}
          loading={loading}
          error={error}
          selectedId={selectedEmail?.id}
          onSelect={handleSelectEmail}
          onRefresh={fetchEmails}
        />

        {selectedEmail ? (
          <ReplyPanel
            key={selectedEmail.id}
            email={selectedEmail}
            onBack={() => setSelectedEmail(null)}
          />
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
              </svg>
            </div>
            <h3>Select an email</h3>
            <p>Choose an email from your inbox to draft an AI-powered reply</p>
          </div>
        )}
      </div>
    </div>
  )
}

