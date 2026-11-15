import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000'

const STEPS = [
  ['Connect Gmail', 'Sign in with Google and allow read and send access.'],
  ['Pick an email and a tone', 'Professional, friendly, concise or formal.'],
  ['Review and send', 'Edit the AI draft, then send it with one click.'],
]

const TRUST = [
  'You review every reply before it is sent',
  'Only Gmail read and send permissions are requested',
  'Sign out at any time',
]

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export default function LoginScreen() {
  const [failed] = useState(
    () => new URLSearchParams(window.location.search).get('login') === 'failed'
  )

  useEffect(() => {
    if (failed) window.history.replaceState({}, '', window.location.pathname)
  }, [failed])

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-brand">
          <div className="header-logo">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          ReplyWise
        </div>
        <ThemeToggle />
      </nav>

      <main className="landing-main">
        <section className="landing-hero">
          <span className="landing-pill">AI email assistant</span>
          <h1>Reply to every email <span>in seconds.</span></h1>
          <p className="landing-lead">
            ReplyWise reads your message, drafts a reply in the tone you choose,
            and waits for your approval before anything is sent.
          </p>
          <ol className="landing-steps">
            {STEPS.map(([title, text], i) => (
              <li key={title}>
                <span className="step-num">{i + 1}</span>
                <div><strong>{title}</strong><span>{text}</span></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-card">
          <h2>Get started</h2>
          <p>Sign in with your Google account to connect your inbox.</p>

          {failed && (
            <div className="landing-alert" role="alert">
              Sign-in did not complete. Open this app at http://127.0.0.1:5173 and try again.
            </div>
          )}

          <a className="google-signin" href={`${BACKEND}/auth/login`}>
            <GoogleG /> Continue with Google
          </a>

          <ul className="landing-trust">
            {TRUST.map((t) => (
              <li key={t}><Check /> {t}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}