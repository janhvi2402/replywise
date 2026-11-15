import EmailCard from './EmailCard'

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-avatar" />
      <div className="skeleton-lines">
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line medium" />
        <div className="skeleton skeleton-line long" />
      </div>
    </div>
  )
}

export default function EmailList({ emails, loading, error, selectedId, onSelect, onRefresh }) {
  return (
    <div className="email-list-container">
      <div className="email-list-header">
        <h2>Inbox</h2>
        <span className="email-count">
          {loading ? 'Loading...' : `${emails.length} messages`}
        </span>
      </div>

      <div className="email-list-toolbar">
        <button
          className={`refresh-btn ${loading ? 'loading' : ''}`}
          onClick={onRefresh}
          disabled={loading}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="email-list-scroll">
        {loading && emails.length === 0 ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button className="retry-btn" onClick={onRefresh}>
              Try again
            </button>
          </div>
        ) : emails.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
              </svg>
            </div>
            <h3>All clear!</h3>
            <p>Your inbox is empty</p>
          </div>
        ) : (
          emails.map(email => (
            <EmailCard
              key={email.id}
              email={email}
              selected={email.id === selectedId}
              onClick={() => onSelect(email)}
            />
          ))
        )}
      </div>
    </div>
  )
}

