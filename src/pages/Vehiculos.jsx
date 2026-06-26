import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useColeccion } from '../hooks/useColeccion'
import { crear, actualizar, eliminar } from '../services/firestore'
import { Alerta, Vacio, Spinner, Confirmar } from '../components/ui'
import { IcoCar, IcoEdit, IcoTrash, IcoPlus } from '../components/Icons'
import { CATEGORIAS, estimarConsumo } from '../services/consumoVehiculos'
import { num } from '../services/formato'

export default function Vehiculos() {
  const { user } = useAuth()
  const { items, cargando, error, recargar } = useColeccion('vehicles')
  const { items: combustibles } = useColeccion('fuelTypes')
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(vacio())
  const [fuente, setFuente] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [aBorrar, setABorrar] = useState(null)
  const [msg, setMsg] = useState('')

  function vacio() {
    return { categoria: 'utilitario', modelo: '', anio: '', consumoL100: '', fuelTypeId: '' }
  }

  function abrirNuevo() { setEditando(null); setForm(vacio()); setFuente(''); setMsg('') }
  function abrirEdicion(v) {
    setEditando(v)
    setForm({ categoria: v.categoria, modelo: v.modelo, anio: v.anio || '', consumoL100: v.consumoL100, fuelTypeId: v.fuelTypeId || '' })
    setFuente(''); setMsg('')
  }

  // Recalcula la estimación cuando cambian categoría/modelo/año.
  function recalcular(next) {
    const est = estimarConsumo(next.categoria, next.modelo, next.anio)
    setForm({ ...next, consumoL100: est.consumoL100 })
    setFuente(est.fuente)
  }

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true); setMsg('')
    try {
      const datos = {
        categoria: form.categoria,
        modelo: form.modelo.trim(),
        anio: Number(form.anio) || null,
        consumoL100: Number(form.consumoL100) || 0,
        fuelTypeId: form.fuelTypeId || null
      }
      if (editando) await actualizar('vehicles', editando.id, datos)
      else await crear('vehicles', user.uid, datos)
      setMsg('Guardado.')
      abrirNuevo()
      await recargar()
    } catch (err) {
      setMsg('Error al guardar.')
    } finally { setGuardando(false) }
  }

  async function confirmarBorrar() {
    await eliminar('vehicles', aBorrar.id)
    setABorrar(null)
    await recargar()
  }

  const nombreCombustible = (id) => combustibles.find((c) => c.id === id)?.nombre || '—'
  const nombreCategoria = (id) => CATEGORIAS.find((c) => c.id === id)?.nombre || id

  return (
    <div>
      <div className="section-title">Vehículos</div>

      {combustibles.length === 0 && (
        <Alerta tipo="warn">Primero cargá al menos un combustible en la sección Combustibles para poder asignarlo.</Alerta>
      )}

      <div className="card">
        <h2>{editando ? 'Editar vehículo' : 'Nuevo vehículo'}</h2>
        <p className="sub">Al poner categoría, modelo y año te sugerimos un consumo. Podés ajustarlo al real de tu vehículo.</p>
        {msg === 'Guardado.' && <Alerta tipo="ok" onClose={() => setMsg('')}>Guardado.</Alerta>}
        {msg && msg !== 'Guardado.' && <Alerta tipo="error">{msg}</Alerta>}
        <form onSubmit={guardar}>
          <div className="row">
            <div className="field">
              <label>Categoría</label>
              <select value={form.categoria} onChange={(e) => recalcular({ ...form, categoria: e.target.value })}>
                {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Año</label>
              <input type="number" min="1980" max="2035" value={form.anio} onChange={(e) => recalcular({ ...form, anio: e.target.value })} placeholder="Ej: 2018" />
            </div>
          </div>
          <div className="field">
            <label>Modelo</label>
            <input value={form.modelo} onChange={(e) => recalcular({ ...form, modelo: e.target.value })} placeholder="Ej: Renault Kangoo, Sprinter, Hilux…" />
          </div>
          <div className="field">
            <label>Consumo (L/100 km) — editable</label>
            <input type="number" step="0.1" min="0" value={form.consumoL100} onChange={(e) => { setForm({ ...form, consumoL100: e.target.value }); setFuente('Valor ingresado manualmente') }} required />
            {fuente && <div className="hint">{fuente}</div>}
          </div>
          <div className="field">
            <label>Combustible</label>
            <select value={form.fuelTypeId} onChange={(e) => setForm({ ...form, fuelTypeId: e.target.value })} required>
              <option value="">Elegí un combustible…</option>
              {combustibles.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="btn-row">
            <button className="btn" disabled={guardando || combustibles.length === 0}>{guardando ? <Spinner /> : (editando ? 'Guardar cambios' : <><IcoPlus /> Agregar</>)}</button>
            {editando && <button type="button" className="btn secundario" onClick={abrirNuevo}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Mis vehículos</h2>
        {cargando ? <Spinner /> : error ? <Alerta tipo="error">{error}</Alerta> : items.length === 0 ? (
          <Vacio icono={<IcoCar />} titulo="Todavía no cargaste vehículos">Agregá tu primer vehículo para usarlo en las comparaciones.</Vacio>
        ) : (
          items.map((v) => (
            <div className="list-item" key={v.id}>
              <IcoCar style={{ color: 'var(--primary)' }} />
              <div className="grow">
                <div className="titulo">{v.modelo || nombreCategoria(v.categoria)} {v.anio ? `(${v.anio})` : ''}</div>
                <div className="meta">{nombreCategoria(v.categoria)} · {num(v.consumoL100, 1)} L/100km · {nombreCombustible(v.fuelTypeId)}</div>
              </div>
              <div className="list-actions">
                <button className="iconbtn" onClick={() => abrirEdicion(v)}><IcoEdit /></button>
                <button className="iconbtn peligro" onClick={() => setABorrar(v)}><IcoTrash /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {aBorrar && (
        <Confirmar
          titulo="Eliminar vehículo"
          mensaje={`¿Eliminar "${aBorrar.modelo || nombreCategoria(aBorrar.categoria)}"?`}
          onConfirmar={confirmarBorrar}
          onCancelar={() => setABorrar(null)}
        />
      )}
    </div>
  )
}
