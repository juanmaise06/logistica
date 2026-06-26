import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { CargandoPantalla } from './components/ui'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import VerificarEmail from './pages/VerificarEmail'
import Comparar from './pages/Comparar'
import Historial from './pages/Historial'
import Dashboard from './pages/Dashboard'
import Vehiculos from './pages/Vehiculos'
import Combustibles from './pages/Combustibles'
import Lugares from './pages/Lugares'
import Perfil from './pages/Perfil'

export default function App() {
  const { user, cargando, emailVerificado } = useAuth()
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (cargando) return <CargandoPantalla texto="Iniciando…" />

  if (!user) return <Auth />

  if (!emailVerificado) return <VerificarEmail />

  return (
    <Layout online={online}>
      <Routes>
        <Route path="/" element={<Comparar />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vehiculos" element={<Vehiculos />} />
        <Route path="/combustibles" element={<Combustibles />} />
        <Route path="/lugares" element={<Lugares />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
