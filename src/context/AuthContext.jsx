import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (snap.exists()) {
          const data = snap.data()
          // Always prefer Google displayName if stored name is missing
          const name = data.name || firebaseUser.displayName || firebaseUser.email
          if (!data.name && firebaseUser.displayName) {
            // Backfill the name into Firestore so it's set going forward
            await setDoc(doc(db, 'users', firebaseUser.uid), { name: firebaseUser.displayName }, { merge: true })
          }
          setProfile({ id: snap.id, ...data, name })
        } else {
          setProfile({ id: firebaseUser.uid, role: 'staff', name: firebaseUser.displayName || firebaseUser.email })
        }
      } else {
git add -A
git commit -m "Fix display name from Google profile"
git push
