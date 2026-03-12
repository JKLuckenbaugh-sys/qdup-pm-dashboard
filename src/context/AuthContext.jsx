import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // Firebase auth user
  const [profile, setProfile] = useState(null) // Firestore user doc
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Fetch the user's profile/role from Firestore
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (snap.exists()) {
          setProfile({ id: snap.id, ...snap.data() })
        } else {
          // First time — default profile (admin should set role)
          setProfile({ id: firebaseUser.uid, role: 'staff', name: firebaseUser.displayName || firebaseUser.email })
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const logout = () => signOut(auth)
  const resetPassword = (email) => sendPasswordResetEmail(auth, email)

  const isAdmin = profile?.role === 'admin'
  const isStaff = profile?.role === 'staff' || profile?.role === 'admin'
  const isClient = profile?.role === 'client'

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, resetPassword, isAdmin, isStaff, isClient }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
