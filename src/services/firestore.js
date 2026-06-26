// =============================================================================
//  Acceso a Firestore. Todas las entidades del usuario llevan userId == auth.uid.
//  Los viajes además llevan teamId para que el admin del equipo pueda leerlos.
//  Las reglas de seguridad (firestore.rules) hacen cumplir esto del lado servidor.
// =============================================================================

import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, setDoc,
  query, where, orderBy, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'

// ---------- Usuarios y equipos ----------
export async function getUserDoc(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function crearUserDoc(uid, datos) {
  await setDoc(doc(db, 'users', uid), {
    ...datos,
    createdAt: serverTimestamp()
  }, { merge: true })
}

export async function actualizarUserDoc(uid, datos) {
  await updateDoc(doc(db, 'users', uid), datos)
}

export async function crearEquipo(uid, nombre, joinCode) {
  const ref = await addDoc(collection(db, 'teams'), {
    name: nombre,
    adminUid: uid,
    joinCode,
    createdAt: serverTimestamp()
  })
  await actualizarUserDoc(uid, { teamId: ref.id, role: 'admin' })
  return ref.id
}

export async function getEquipo(teamId) {
  if (!teamId) return null
  const snap = await getDoc(doc(db, 'teams', teamId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function buscarEquipoPorCodigo(joinCode) {
  const q = query(collection(db, 'teams'), where('joinCode', '==', joinCode.toUpperCase().trim()))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

export async function unirseAEquipo(uid, joinCode) {
  const eq = await buscarEquipoPorCodigo(joinCode)
  if (!eq) throw new Error('No existe un equipo con ese código.')
  await actualizarUserDoc(uid, { teamId: eq.id, role: 'miembro' })
  return eq
}

export async function miembrosDeEquipo(teamId) {
  const q = query(collection(db, 'users'), where('teamId', '==', teamId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ---------- CRUD genérico por colección del usuario ----------
function colRef(nombre) {
  return collection(db, nombre)
}

export async function listarDeUsuario(coleccion, uid, orden = 'createdAt') {
  const q = query(colRef(coleccion), where('userId', '==', uid))
  const snap = await getDocs(q)
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  // Ordenamos en cliente para no exigir índices compuestos.
  items.sort((a, b) => {
    const av = a[orden]?.seconds ?? a[orden] ?? 0
    const bv = b[orden]?.seconds ?? b[orden] ?? 0
    return bv - av
  })
  return items
}

export async function crear(coleccion, uid, datos) {
  const ref = await addDoc(colRef(coleccion), {
    ...datos,
    userId: uid,
    createdAt: serverTimestamp()
  })
  return ref.id
}

export async function actualizar(coleccion, id, datos) {
  await updateDoc(doc(db, coleccion, id), { ...datos, updatedAt: serverTimestamp() })
}

export async function eliminar(coleccion, id) {
  await deleteDoc(doc(db, coleccion, id))
}

// ---------- Viajes ----------
export async function crearViaje(uid, teamId, datos) {
  const ref = await addDoc(collection(db, 'trips'), {
    ...datos,
    userId: uid,
    teamId: teamId || null,
    createdAt: serverTimestamp()
  })
  return ref.id
}

// Viajes propios (miembro) en un rango de fechas.
export async function viajesPropios(uid, desde, hasta) {
  const q = query(collection(db, 'trips'), where('userId', '==', uid))
  const snap = await getDocs(q)
  return filtrarYordenar(snap, desde, hasta)
}

// Viajes de todo el equipo (solo admin). Requiere que las reglas lo permitan.
export async function viajesDeEquipo(teamId, desde, hasta) {
  const q = query(collection(db, 'trips'), where('teamId', '==', teamId))
  const snap = await getDocs(q)
  return filtrarYordenar(snap, desde, hasta)
}

function filtrarYordenar(snap, desde, hasta) {
  let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  if (desde) {
    const t = desde instanceof Date ? desde.getTime() : new Date(desde).getTime()
    items = items.filter((v) => fechaMs(v.fecha) >= t)
  }
  if (hasta) {
    const t = hasta instanceof Date ? hasta.getTime() : new Date(hasta).getTime()
    items = items.filter((v) => fechaMs(v.fecha) <= t)
  }
  items.sort((a, b) => fechaMs(b.fecha) - fechaMs(a.fecha))
  return items
}

function fechaMs(f) {
  if (!f) return 0
  if (f.seconds) return f.seconds * 1000
  return new Date(f).getTime()
}

export function fechaATimestamp(d) {
  return Timestamp.fromDate(d instanceof Date ? d : new Date(d))
}
