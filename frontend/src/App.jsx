import { useState, useEffect } from 'react'
import LoginScreen from './components/LoginScreen'
import Dashboard from './components/Dashboard'
import DemoApp from './components/DemoApp'

function App() {
  const [authenticated, setAuthenticated] = useState(null) // null = checking
  const [demo, setDemo] = useState(() => window.location.hash === '#demo')

  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setAuthenticated(Boolean(data.authenticated)))
      .catch(() => setAuthenticated(false))
  }, [])

  function openDemo() {
    window.location.hash = 'demo'
    setDemo(true)
  }

  function closeDemo() {
    window.history.replaceState(null, '', window.location.pathname)
    setDemo(false)
  }

  async function handleLogout() {
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      /* ignore */
    }
    setAuthenticated(false)
  }

  if (demo) return <DemoApp onExit={closeDemo} />

  if (authenticated === null) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
        <p>Loading ReplyWise...</p>
      </div>
    )
  }

  if (!authenticated) return <LoginScreen onDemo={openDemo} />

  return <Dashboard onLogout={handleLogout} />
}

export default App