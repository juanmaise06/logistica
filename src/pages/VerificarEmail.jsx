import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Alerta, Spinner } from '../components/ui'

export default function VerificarEmail() {
  const { user, reenviarVerificacion, chequearVerificacion, logout } = useAuth()
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function reenviar() {
    setError(''); setMsg(''); setCargando(true)
    try {
      await reenviarVerificacion()
      setMsg('Te reenviamos el correo de verificación. Revisá también el spam.')
    } catch (e) {
      setError('No se pudo reenviar (esperá unos minutos e intentá de nuevo).')
    } finally { setCargando(false) }
  }

  async function yaVerifique() {
    setError(''); setMsg(''); setCargando(true)
    try {
      const ok = await chequearVerificacion()
      if (!ok) setError('Todavía no figura verificado. Hacé clic en el enlace del correo y reintentá.')
    } catch (e) {
      setError('No se pudo comprobar. Revisá tu conexión.')
    } finally { setCargando(false) }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h2>Verificá tu correo</h2>
        <p className="sub">
          Enviamos un enlace de verificación a <strong>{user?.email}</strong>.
          Tenés que confirmarlo para poder usar la app.
        </p>

        <Alerta tipo="ok" onClose={() => setMsg('')}>{msg}</Alerta>
        <Alerta tipo="error" onClose={() => setError('')}>{error}</Alerta>

        <div className="alert info">
          1. Abrí el correo y hacé clic en el enlace. <br />
          2. Volvé acá y tocá <strong>"Ya verifiqué"</strong>.
        </div>

        <button className="btn" onClick={yaVerifique} disabled={cargando}>
          {cargando ? <Spinner /> : 'Ya verifiqué mi correo'}
        </button>
        <div className="btn-row mt">
          <button className="btn secundario" onClick={reenviar} disabled={cargando}>Reenviar correo</button>
          <button className="btn secundario" onClick={logout}>Salir</button>
        </div>
      </div>
    </div>
  )
}
