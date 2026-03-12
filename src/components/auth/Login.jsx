import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../firebase'

const provider = new GoogleAuthProvider()

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleGoogle() {
    setError('')
    setGoogleLoading(true)
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || user.email,
          email: user.email,
          photoURL: user.photoURL || null,
          role: 'staff',
          clientId: null,
          createdAt: serverTimestamp(),
        })
      } else {
        await setDoc(userRef, { lastLogin: serverTimestamp(), photoURL: user.photoURL || null }, { merge: true })
      }
      navigate('/')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign in failed. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleEmail(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (resetMode) {
        await sendPasswordResetEmail(auth, email)
        setResetSent(true)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        navigate('/')
      }
    } catch (err) {
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          setError('Invalid email or password.')
          break
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later.')
          break
        case 'auth/invalid-email':
          setError('Please enter a valid email address.')
          break
        default:
          setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e12] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#4D7FA3]/8 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-[#E87722]/6 blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-10">
          <img src="/qdup-logo.png" alt="Q'd Up" className="h-14 mx-auto mb-4 object-contain" />
          <div className="h-px brand-gradient w-16 mx-auto mb-3 rounded-full opacity-60" />
          <p className="text-gray-500 text-sm">Project Management Portal</p>
        </div>

        <div className="bg-[#0f1519] border border-[#1e2d3a] rounded-2xl p-8">
          {resetSent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-400 text-xl">✓</span>
              </div>
              <p className="text-white font-medium mb-1">Check your inbox</p>
              <p className="text-gray-400 text-sm">Reset link sent to <span className="text-[#E87722]">{email}</span></p>
              <button onClick={() => { setResetMode(false); setResetSent(false) }} className="mt-6 btn-ghost w-full">
                Back to login
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-lg font-bold text-white mb-6">
                {resetMode ? 'Reset your password' : 'Welcome back'}
              </h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5 text-red-400 text-sm mb-4">{error}</div>
              )}

              {/* Google button */}
              {!resetMode && (
                <>
                  <button
                    onClick={handleGoogle}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold px-4 py-3 rounded-lg transition-all duration-150 text-sm mb-4"
                  >
                    {googleLoading ? (
                      <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    {googleLoading ? 'Signing in...' : 'Continue with Google'}
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-[#1e2d3a]" />
                    <span className="text-xs text-gray-600">or sign in with email</span>
                    <div className="flex-1 h-px bg-[#1e2d3a]" />
                  </div>
                </>
              )}

              {/* Email form */}
              <form onSubmit={handleEmail} className="space-y-4">
                <div>
                  <label className="label block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="you@email.com"
                    required
                  />
                </div>
                {!resetMode && (
                  <div>
                    <label className="label block mb-1.5">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input-field"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? (
                    <span className="inline-flex items-center gap-2 justify-center">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {resetMode ? 'Sending...' : 'Signing in...'}
                    </span>
                  ) : resetMode ? 'Send reset link' : 'Sign in with Email'}
                </button>
              </form>

              <button
                onClick={() => { setResetMode(!resetMode); setError('') }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-300 mt-4 transition-colors"
              >
                {resetMode ? '← Back to login' : 'Forgot your password?'}
              </button>
            </>
          )}
        </div>
        <p className="text-center text-xs text-gray-600 mt-6">Access is by invitation only. Contact your admin.</p>
      </div>
    </div>
  )
}
