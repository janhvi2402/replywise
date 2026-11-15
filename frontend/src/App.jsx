import { useState, useEffect } from 'react'
import LoginScreen from './components/LoginScreen'
import Dashboard from './components/Dashboard'

function App() {
  const [authenticated, setAuthenticated] = useState(null) // null = checking

  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setAuthenticated(Boolean(data.authenticated)))
      .catch(() => setAuthenticated(false))
  }, [])

  async function handleLogout() {
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      /* ignore */
    }
    setAuthenticated(false)
  }

  if (authenticated === null) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
        <p>Loading ReplyWise...</p>
      </div>
    )
  }

  if (!authenticated) return <LoginScreen />

  return <Dashboard onLogout={handleLogout} />
}

export default App