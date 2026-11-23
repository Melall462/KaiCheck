import { useState } from 'react';
import { useStore } from '../store';

function Brand() {
  return (
    <div className="brand" style={{ marginBottom: 8 }}>
      <svg width="40" height="40" viewBox="0 0 34 34" aria-hidden="true">
        <rect width="34" height="34" rx="10" fill="var(--accent)" />
        <path d="M9 22c0-7 5-11 15-11 0 8-4 13-11 13-1.5 0-3-.5-4-2z" fill="var(--accent-ink)" />
        <path d="M10 25c3-5 6-8 10-10" stroke="var(--accent)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
      <div>
        <b>KaiCheck</b>
        <span>Food and allergy log for early learning centres</span>
      </div>
    </div>
  );
}

function Screen({ children }) {
  return (
    <div className="authwrap">
      <Brand />
      <div className="panel authpanel">{children}</div>
    </div>
  );
}

export function Loading() {
  return (
    <Screen>
      <p className="sub" role="status">Loading…</p>
    </Screen>
  );
}

export function SetupNeeded() {
  return (
    <Screen>
      <h2>Connect Supabase</h2>
      <p>This app needs your Supabase project details before it can start.</p>
      <ol className="steps">
        <li>Copy <code>.env.example</code> to <code>.env.local</code>.</li>
        <li>In Supabase, open Project Settings, then API Keys, and copy the publishable key into <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.</li>
        <li>Stop and restart <code>npm run dev</code>.</li>
      </ol>
    </Screen>
  );
}

export function ErrorScreen({ message }) {
  const { actions } = useStore();
  return (
    <Screen>
      <h2>Could not load</h2>
      <p className="err">{message}</p>
      <p className="sub">Check your connection and that the database setup SQL has been run.</p>
      <button className="btn primary" onClick={actions.retry}>Try again</button>
    </Screen>
  );
}

export function SignIn() {
  const { actions } = useStore();
  const [mode, setMode] = useState('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'in') await actions.auth.signIn(email.trim(), password);
      else {
        const r = await actions.auth.signUp(email.trim(), password);
        if (r.needsConfirmation) {
          setInfo('Check your email and click the link to confirm your account, then sign in.');
          setMode('in');
        }
      }
    } catch (ex) {
      setErr(ex.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <div className="tabs" role="group" aria-label="Sign in or create account">
        <button type="button" aria-pressed={mode === 'in'} onClick={() => setMode('in')}>Sign in</button>
        <button type="button" aria-pressed={mode === 'up'} onClick={() => setMode('up')}>Create account</button>
      </div>
      <form onSubmit={submit} className="authform">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input type="text" id="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {info && <div className="banner good">{info}</div>}
        <div className="err" role="alert">{err}</div>
        <button className="btn primary" type="submit" disabled={busy || !email || !password}>
          {mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </Screen>
  );
}

export function Onboarding() {
  const { actions } = useStore();
  const [mode, setMode] = useState('new');
  const [name, setName] = useState('');
  const [centre, setCentre] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'new') await actions.auth.createCentre(centre, name);
      else await actions.auth.joinCentre(code, name);
    } catch (ex) {
      setErr(ex.message || 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <Screen>
      <h2>Welcome</h2>
      <div className="tabs" role="group" aria-label="Set up or join">
        <button type="button" aria-pressed={mode === 'new'} onClick={() => setMode('new')}>Set up a centre</button>
        <button type="button" aria-pressed={mode === 'join'} onClick={() => setMode('join')}>Join with a code</button>
      </div>
      <form onSubmit={submit} className="authform">
        <div className="field">
          <label htmlFor="yourname">Your name</label>
          <input type="text" id="yourname" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {mode === 'new' ? (
          <div className="field">
            <label htmlFor="centre">Centre name</label>
            <input type="text" id="centre" value={centre} onChange={(e) => setCentre(e.target.value)} />
            <span className="sub">You will be the centre manager and can invite staff with a join code.</span>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="code">Join code</label>
            <input type="text" id="code" autoCapitalize="characters" value={code} onChange={(e) => setCode(e.target.value)} />
            <span className="sub">Ask your centre manager. You will join as a teacher.</span>
          </div>
        )}
        <div className="err" role="alert">{err}</div>
        <div className="row">
          <button className="btn primary" type="submit" disabled={busy || !name.trim() || (mode === 'new' ? !centre.trim() : !code.trim())}>
            {mode === 'new' ? 'Create centre' : 'Join centre'}
          </button>
          <button className="btn" type="button" onClick={actions.auth.signOut}>Sign out</button>
        </div>
      </form>
    </Screen>
  );
}
