import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useColeccion } from '../hooks/useColeccion'
import { crear, actualizar, eliminar } from '../services/firestore'
import { Alerta, Vacio, Spinner, Confirmar } from '../components/ui'
import { IcoPin, IcoEdit, IcoTrash, IcoPlus } from '../components/Icons'
import AutocompleteDireccion from '../components/AutocompleteDireccion'

export default function Lugares() {
  const { user } = useAuth()
  const { items, cargando, error, recargar } = useColeccion('places')
  const [nombre, setNombre] = useState('')
  const [seleccion, setSeleccion] = useState(null) // {nombre, direccion, lat, lng}
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')
  const [filtro, setFiltro] = useState('')
  const [editando, setEditando] = useState(null)
  const [aBorrar, setABorrar] = useState(null)

  async function guardar(e) {
    e.preventDefault()
    if (!seleccion) { setMsg('Elegí una dirección de la lista de sugerencias.'); return }
    setGuardando(true); setMsg('')
    try {
      const datos = {
        nombre: nombre.trim() || seleccion.nombre,
        direccion: seleccion.direccion,
        lat: seleccion.lat,
        lng: seleccion.lng
      }
      if (editando) await actualizar('places', editando.id, datos)
      else await crear('places', user.uid, datos)
      setMsg('Lugar guardado.')
      setNombre(''); setSeleccion(null); setEditando(null)
      await recargar()
    } catch (err) {
      setMsg('Error al guardar el lugar.')
    } finally { setGuardando(false) }
  }

  function editar(l) {
    setEditando(l)
    setNombre(l.nombre)
    setSeleccion({ nombre: l.nombre, direccion: l.direccion, lat: l.lat, lng: l.lng })
    setMsg('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelar() { setEditando(null); setNombre(''); setSeleccion(null); setMsg('') }

  async function confirmarBorrar() {
    await eliminar('places', aBorrar.id)
    setABorrar(null)
    await recargar()
  }

  const filtrados = items.filter((l) =>
    (l.nombre + ' ' + l.direccion).toLowerCase().includes(filtro.toLowerCase()))

  return (
    <div>
      <div className="section-title">Lugares guardados</div>

      <div className="card">
        <h2>{editando ? 'Editar lugar' : 'Nuevo lugar'}</h2>
        <p className="sub">Buscá una dirección o localidad y guardala con un nombre para reutilizarla en tus recorridos.</p>
        {msg && <Alerta tipo={msg.includes('Error') || msg.includes('Elegí') ? 'error' : 'ok'} onClose={() => setMsg('')}>{msg}</Alerta>}
        <form onSubmit={guardar}>
          <div className="field">
            <label>Dirección / localidad</label>
            <AutocompleteDireccion
              key={editando ? editando.id : 'nuevo'}
              valorInicial={editando ? editando.direccion : ''}
              onSeleccion={(s) => { setSeleccion(s); if (!nombre) setNombre(s.nombre) }}
            />
            {seleccion && <div className="hint">📍 {seleccion.direccion} ({seleccion.lat.toFixed(4)}, {seleccion.lng.toFixed(4)})</div>}
          </div>
          <div className="field">
            <label>Nombre del lugar</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Proveedor Avellaneda, Depósito Central" />
          </div>
          <div className="btn-row">
            <button className="btn" disabled={guardando}>{guardando ? <Spinner /> : (editando ? 'Guardar cambios' : <><IcoPlus /> Guardar lugar</>)}</button>
            {editando && <button type="button" className="btn secundario" onClick={cancelar}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="flex-between mb">
          <h2 style={{ margin: 0 }}>Mis lugares</h2>
          {items.length > 0 && (
            <input style={{ maxWidth: 220 }} placeholder="Buscar…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          )}
        </div>
        {cargando ? <Spinner /> : error ? <Alerta tipo="error">{error}</Alerta> : items.length === 0 ? (
          <Vacio icono={<IcoPin />} titulo="Todavía no guardaste lugares">Guardá proveedores, depósitos o localidades frecuentes.</Vacio>
        ) : filtrados.length === 0 ? (
          <p className="muted">Sin resultados para "{filtro}".</p>
        ) : (
          filtrados.map((l) => (
            <div className="list-item" key={l.id}>
              <IcoPin style={{ color: 'var(--accent)' }} />
              <div className="grow">
                <div className="titulo">{l.nombre}</div>
                <div className="meta">{l.direccion}</div>
              </div>
              <div className="list-actions">
                <button className="iconbtn" onClick={() => editar(l)}><IcoEdit /></button>
                <button className="iconbtn peligro" onClick={() => setABorrar(l)}><IcoTrash /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {aBorrar && (
        <Confirmar titulo="Eliminar lugar" mensaje={`¿Eliminar "${aBorrar.nombre}"?`}
          onConfirmar={confirmarBorrar} onCancelar={() => setABorrar(null)} />
      )}
    </div>
  )
}
