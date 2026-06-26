import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Alerta, Spinner, Modal } from '../components/ui'
import { IcoUser, IcoLogout } from '../components/Icons'
import {
  crearEquipo, unirseAEquipo, miembrosDeEquipo, actualizarUserDoc
} from '../services/firestore'
import { generarCodigoEquipo } from '../services/formato'

export default function Perfil() {
  const { user, perfil, equipo, logout, refrescarPerfil } = useAuth()
  const [valorHora, setValorHora] = useState(perfil?.valorHora ?? 0)
  const [guardandoVH, setGuardandoVH] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  // Equipo
  const [nombreEquipo, setNombreEquipo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [miembros, setMiembros] = useState([])
  const [copiado, setCopiado] = useState(false)

  useEffect(() => { setValorHora(perfil?.valorHora ?? 0) }, [perfil])

  useEffect(() => {
    async function cargar() {
      if (equipo && perfil?.role === 'admin') {
        try { setMiembros(await miembrosDeEquipo(equipo.id)) } catch (e) { /* reglas */ }
      }
    }
    cargar()
  }, [equipo, perfil])

  async function guardarValorHora(e) {
    e.preventDefault()
    setGuardandoVH(true); setMsg(''); setError('')
    try {
      await actualizarUserDoc(user.uid, { valorHora: Number(valorHora) || 0 })
      await refrescarPerfil()
      setMsg('Valor por hora actualizado.')
    } catch (err) { setError('No se pudo guardar.') }
    finally { setGuardandoVH(false) }
  }

  async function onCrearEquipo(e) {
    e.preventDefault()
    setProcesando(true); setError(''); setMsg('')
    try {
      const code = generarCodigoEquipo()
      await crearEquipo(user.uid, nombreEquipo.trim() || 'Mi equipo', code)
      await refrescarPerfil()
      setMsg('Equipo creado. Compartí el código con tu gente.')
    } catch (err) { setError('No se pudo crear el equipo.') }
    finally { setProcesando(false) }
  }

  async function onUnirse(e) {
    e.preventDefault()
    setProcesando(true); setError(''); setMsg('')
    try {
      await unirseAEquipo(user.uid, codigo)
      await refrescarPerfil()
      setMsg('Te uniste al equipo.')
    } catch (err) { setError(err.message) }
    finally { setProcesando(false) }
  }

  function copiarCodigo() {
    navigator.clipboard?.writeText(equipo.joinCode)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1800)
  }

  return (
    <div>
      <div className="section-title">Perfil y equipo</div>

      {msg && <Alerta tipo="ok" onClose={() => setMsg('')}>{msg}</Alerta>}
      {error && <Alerta tipo="error" onClose={() => setError('')}>{error}</Alerta>}

      <div className="card">
        <div className="flex-between">
          <div className="list-item" style={{ border: 'none', background: 'none', margin: 0, padding: 0 }}>
            <IcoUser style={{ color: 'var(--primary)' }} />
            <div className="grow">
              <div className="titulo">{perfil?.displayName || user.email}</div>
              <div className="meta">{user.email} {perfil?.role && <span className={`badge ${perfil.role}`}>{perfil.role}</span>}</div>
            </div>
          </div>
          <button className="btn secundario auto" onClick={logout}><IcoLogout /> Salir</button>
        </div>
      </div>

      <div className="card">
        <h2>Valor de tu tiempo</h2>
        <p className="sub">Opcional. Si lo cargás, la app suma el costo del tiempo de viaje a la comparación (además del combustible).</p>
        <form onSubmit={guardarValorHora}>
          <div className="field">
            <label>Valor por hora ($/h)</label>
            <input type="number" min="0" step="100" value={valorHora} onChange={(e) => setValorHora(e.target.value)} placeholder="Ej: 5000 (0 = no contar el tiempo)" />
            <div className="hint">Con 0, la recomendación se basa solo en el combustible. Igual siempre ves el tiempo aparte.</div>
          </div>
          <button className="btn auto" disabled={guardandoVH}>{guardandoVH ? <Spinner /> : 'Guardar'}</button>
        </form>
      </div>

      <div className="card">
        <h2>Equipo</h2>
        {equipo ? (
          <>
            <p className="sub">Pertenecés al equipo <strong>{equipo.name}</strong> como <strong>{perfil?.role}</strong>.</p>
            {perfil?.role === 'admin' && (
              <>
                <div className="field">
                  <label>Código de invitación</label>
                  <div className="btn-row">
                    <div className="chip" style={{ fontSize: '1.1rem', letterSpacing: '2px', fontWeight: 700 }}>{equipo.joinCode}</div>
                    <button className="btn secundario auto" onClick={copiarCodigo}>{copiado ? '✓ Copiado' : 'Copiar'}</button>
                  </div>
                  <div className="hint">Compartilo por WhatsApp para que tu gente se una.</div>
                </div>
                <h2 style={{ fontSize: '1rem', marginTop: 16 }}>Miembros ({miembros.length})</h2>
                {miembros.map((m) => (
                  <div className="list-item" key={m.id}>
                    <IcoUser />
                    <div className="grow">
                      <div className="titulo">{m.displayName || m.email}</div>
                      <div className="meta">{m.email}</div>
                    </div>
                    <span className={`badge ${m.role}`}>{m.role}</span>
                  </div>
                ))}
                <div className="hint">Como admin podés ver los viajes de todos los miembros en el Historial.</div>
              </>
            )}
            {perfil?.role === 'miembro' && (
              <Alerta tipo="info">Sos miembro de este equipo. Tus viajes son privados; solo el administrador puede verlos.</Alerta>
            )}
          </>
        ) : (
          <div className="grid-2">
            <div>
              <h2 style={{ fontSize: '1rem' }}>Crear un equipo</h2>
              <form onSubmit={onCrearEquipo}>
                <div className="field">
                  <label>Nombre del equipo</label>
                  <input value={nombreEquipo} onChange={(e) => setNombreEquipo(e.target.value)} placeholder="Ej: Transportes López" />
                </div>
                <button className="btn" disabled={procesando}>{procesando ? <Spinner /> : 'Crear equipo (sos admin)'}</button>
              </form>
            </div>
            <div>
              <h2 style={{ fontSize: '1rem' }}>Unirme con un código</h2>
              <form onSubmit={onUnirse}>
                <div className="field">
                  <label>Código de invitación</label>
                  <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="Ej: AB12CD" maxLength={8} />
                </div>
                <button className="btn secundario" disabled={procesando}>{procesando ? <Spinner /> : 'Unirme'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
