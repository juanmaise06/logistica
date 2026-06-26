import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Alerta, Spinner } from '../components/ui'
import { IcoTruck } from '../components/Icons'
import { unirseAEquipo } from '../services/firestore'

export default function Auth() {
  const { login, registrar, recuperarPassword } = useAuth()
  const [modo, setModo] = useState('login') // login | registro | recuperar
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [nombre, setNombre] = useState('')
  const [codigoEquipo, setCodigoEquipo] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [cargando, setCargando] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError(''); setOk(''); setCargando(true)
    try {
      if (modo === 'login') {
        await login(email.trim(), pass)
      } else if (modo === 'registro') {
        const u = await registrar(email.trim(), pass, nombre.trim())
        // Si puso código de equipo, intentamos unirlo (no bloqueante si falla).
        if (codigoEquipo.trim()) {
          try { await unirseAEquipo(u.uid, codigoEquipo) } catch (err) { /* lo reintenta luego en Perfil */ }
        }
        setOk('Cuenta creada. Te enviamos un correo de verificación.')
      } else if (modo === 'recuperar') {
        await recuperarPassword(email.trim())
        setOk('Si el correo existe, te enviamos un enlace para recuperar la contraseña.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="logo-big">
          <IcoTruck style={{ color: 'var(--primary)' }} />
          <h2 style={{ marginBottom: 0 }}>Logística</h2>
          <p className="sub" style={{ textAlign: 'center' }}>Compará viajes y decidí a dónde ir a buscar.</p>
        </div>

        <Alerta tipo="error" onClose={() => setError('')}>{error}</Alerta>
        <Alerta tipo="ok" onClose={() => setOk('')}>{ok}</Alerta>

        <form onSubmit={onSubmit}>
          {modo === 'registro' && (
            <div className="field">
              <label>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" required />
            </div>
          )}
          <div className="field">
            <label>Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@correo.com" required autoComplete="email" />
          </div>
          {modo !== 'recuperar' && (
            <div className="field">
              <label>Contraseña</label>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" required autoComplete={modo === 'login' ? 'current-password' : 'new-password'} />
            </div>
          )}
          {modo === 'registro' && (
            <div className="field">
              <label>Código de equipo (opcional)</label>
              <input value={codigoEquipo} onChange={(e) => setCodigoEquipo(e.target.value.toUpperCase())} placeholder="Ej: AB12CD" maxLength={8} />
              <div className="hint">Si tu jefe te pasó un código, ingresalo. Si no, podés crear un equipo después.</div>
            </div>
          )}

          <button className="btn" disabled={cargando}>
            {cargando ? <Spinner /> : modo === 'login' ? 'Entrar' : modo === 'registro' ? 'Crear cuenta' : 'Enviar enlace'}
          </button>
        </form>

        {modo === 'login' && (
          <>
            <div className="auth-switch">
              <button onClick={() => { setModo('recuperar'); setError(''); setOk('') }}>¿Olvidaste tu contraseña?</button>
            </div>
            <div className="auth-switch">
              ¿No tenés cuenta? <button onClick={() => { setModo('registro'); setError(''); setOk('') }}>Registrate</button>
            </div>
          </>
        )}
        {modo !== 'login' && (
          <div className="auth-switch">
            <button onClick={() => { setModo('login'); setError(''); setOk('') }}>← Volver a iniciar sesión</button>
          </div>
        )}
      </div>
    </div>
  )
}
