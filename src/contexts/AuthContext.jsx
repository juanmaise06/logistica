import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendEmailVerification, sendPasswordResetEmail, onAuthStateChanged, reload
} from 'firebase/auth'
import { auth } from '../firebase'
import { getUserDoc, crearUserDoc, getEquipo } from '../services/firestore'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

// Traduce códigos de error de Firebase a mensajes en español.
function traducirError(code) {
  const map = {
    'auth/email-already-in-use': 'Ese correo ya está registrado.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/weak-password': 'La contraseña es muy débil (mínimo 6 caracteres).',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Esperá un momento e intentá de nuevo.',
    'auth/network-request-failed': 'Sin conexión. Revisá tu internet.'
  }
  return map[code] || 'Ocurrió un error. Intentá de nuevo.'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)        // usuario de Firebase Auth
  const [perfil, setPerfil] = useState(null)     // doc users/{uid}
  const [equipo, setEquipo] = useState(null)     // doc teams/{teamId}
  const [cargando, setCargando] = useState(true)

  const refrescarPerfil = useCallback(async (fbUser) => {
    const u = fbUser || auth.currentUser
    if (!u) {
      setPerfil(null)
      setEquipo(null)
      return
    }
    let p = await getUserDoc(u.uid)
    if (!p) {
      // Primera vez: creamos el doc base.
      await crearUserDoc(u.uid, { email: u.email, displayName: u.displayName || u.email, teamId: null, role: null })
      p = await getUserDoc(u.uid)
    }
    setPerfil(p)
    setEquipo(p?.teamId ? await getEquipo(p.teamId) : null)
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser)
      if (fbUser) {
        try { await refrescarPerfil(fbUser) } catch (e) { /* reglas/red */ }
      } else {
        setPerfil(null)
        setEquipo(null)
      }
      setCargando(false)
    })
    return unsub
  }, [refrescarPerfil])

  async function registrar(email, password, displayName) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await crearUserDoc(cred.user.uid, { email, displayName: displayName || email, teamId: null, role: null })
      await sendEmailVerification(cred.user)
      return cred.user
    } catch (e) {
      throw new Error(traducirError(e.code))
    }
  }

  async function login(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      return cred.user
    } catch (e) {
      throw new Error(traducirError(e.code))
    }
  }

  async function logout() {
    await signOut(auth)
  }

  async function reenviarVerificacion() {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser)
  }

  async function recuperarPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (e) {
      throw new Error(traducirError(e.code))
    }
  }

  // Recarga el estado de verificación desde el servidor.
  async function chequearVerificacion() {
    if (!auth.currentUser) return false
    await reload(auth.currentUser)
    if (auth.currentUser.emailVerified) {
      // Forzamos un token nuevo: si no, las reglas de Firestore siguen viendo
      // email_verified=false y rechazan las escrituras (error al guardar).
      try { await auth.currentUser.getIdToken(true) } catch (e) { /* reintenta luego */ }
    }
    setUser({ ...auth.currentUser })
    return auth.currentUser.emailVerified
  }

  const value = {
    user, perfil, equipo, cargando,
    emailVerificado: user?.emailVerified ?? false,
    registrar, login, logout, reenviarVerificacion, recuperarPassword,
    chequearVerificacion, refrescarPerfil
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
