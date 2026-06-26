import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { listarDeUsuario } from '../services/firestore'

// Hook genérico para cargar y refrescar una colección del usuario.
export function useColeccion(nombre) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const recargar = useCallback(async () => {
    if (!user) return
    setCargando(true); setError('')
    try {
      setItems(await listarDeUsuario(nombre, user.uid))
    } catch (e) {
      setError('No se pudieron cargar los datos. Revisá tu conexión.')
    } finally {
      setCargando(false)
    }
  }, [user, nombre])

  useEffect(() => { recargar() }, [recargar])

  return { items, cargando, error, recargar, setItems }
}
