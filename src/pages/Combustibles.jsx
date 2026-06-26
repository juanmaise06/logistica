import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useColeccion } from '../hooks/useColeccion'
import { crear, actualizar, eliminar } from '../services/firestore'
import { Alerta, Vacio, Spinner, Confirmar } from '../components/ui'
import { IcoFuel, IcoEdit, IcoTrash, IcoPlus } from '../components/Icons'
import { pesos } from '../services/formato'

export default function Combustibles() {
  const { user } = useAuth()
  const { items, cargando, error, recargar } = useColeccion('fuelTypes')
  const [editando, setEditando] = useState(null) // objeto o null
  const [form, setForm] = useState(vacio())
  const [guardando, setGuardando] = useState(false)
  const [aBorrar, setABorrar] = useState(null)
  const [msg, setMsg] = useState('')

  function vacio() { return { nombre: '', tipoBase: 'nafta', precioPorLitro: '' } }

  function abrirNuevo() { setEditando(null); setForm(vacio()); setMsg('') }
  function abrirEdicion(f) { setEditando(f); setForm({ nombre: f.nombre, tipoBase: f.tipoBase, precioPorLitro: f.precioPorLitro }); setMsg('') }

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true); setMsg('')
    try {
      const datos = {
        nombre: form.nombre.trim(),
        tipoBase: form.tipoBase,
        precioPorLitro: Number(form.precioPorLitro) || 0
      }
      if (editando) await actualizar('fuelTypes', editando.id, datos)
      else await crear('fuelTypes', user.uid, datos)
      setMsg('Guardado.')
      setForm(vacio()); setEditando(null)
      await recargar()
    } catch (err) {
      setMsg('Error al guardar.')
    } finally { setGuardando(false) }
  }

  async function confirmarBorrar() {
    await eliminar('fuelTypes', aBorrar.id)
    setABorrar(null)
    await recargar()
  }

  return (
    <div>
      <div className="section-title">Combustibles</div>

      <div className="card">
        <h2>{editando ? 'Editar combustible' : 'Nuevo combustible'}</h2>
        <p className="sub">Creá tu lista de combustibles con su precio por litro. Actualizá el precio cuando cambie.</p>
        <Alerta tipo="ok" onClose={() => setMsg('')}>{msg === 'Guardado.' ? msg : ''}</Alerta>
        <Alerta tipo="error">{msg && msg !== 'Guardado.' ? msg : ''}</Alerta>
        <form onSubmit={guardar}>
          <div className="field">
            <label>Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Nafta Súper, Infinia, Gasoil G3…" required />
          </div>
          <div className="row">
            <div className="field">
              <label>Tipo base</label>
              <select value={form.tipoBase} onChange={(e) => setForm({ ...form, tipoBase: e.target.value })}>
                <option value="nafta">Nafta</option>
                <option value="gasoil">Gasoil</option>
              </select>
            </div>
            <div className="field">
              <label>Precio por litro (ARS)</label>
              <input type="number" step="0.01" min="0" value={form.precioPorLitro} onChange={(e) => setForm({ ...form, precioPorLitro: e.target.value })} placeholder="Ej: 1100" required />
            </div>
          </div>
          <div className="btn-row">
            <button className="btn" disabled={guardando}>{guardando ? <Spinner /> : (editando ? 'Guardar cambios' : <><IcoPlus /> Agregar</>)}</button>
            {editando && <button type="button" className="btn secundario" onClick={abrirNuevo}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Mis combustibles</h2>
        {cargando ? <Spinner /> : error ? <Alerta tipo="error">{error}</Alerta> : items.length === 0 ? (
          <Vacio icono={<IcoFuel />} titulo="Todavía no cargaste combustibles">Agregá al menos uno para asignarlo a tus vehículos.</Vacio>
        ) : (
          items.map((f) => (
            <div className="list-item" key={f.id}>
              <IcoFuel style={{ color: 'var(--warn)' }} />
              <div className="grow">
                <div className="titulo">{f.nombre}</div>
                <div className="meta">{f.tipoBase === 'nafta' ? 'Nafta' : 'Gasoil'} · {pesos(f.precioPorLitro)}/L</div>
              </div>
              <div className="list-actions">
                <button className="iconbtn" onClick={() => abrirEdicion(f)}><IcoEdit /></button>
                <button className="iconbtn peligro" onClick={() => setABorrar(f)}><IcoTrash /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {aBorrar && (
        <Confirmar
          titulo="Eliminar combustible"
          mensaje={`¿Eliminar "${aBorrar.nombre}"? Los vehículos que lo usen quedarán sin combustible asignado.`}
          onConfirmar={confirmarBorrar}
          onCancelar={() => setABorrar(null)}
        />
      )}
    </div>
  )
}
