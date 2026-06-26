import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useColeccion } from '../hooks/useColeccion'
import { viajesPropios, viajesDeEquipo, miembrosDeEquipo, eliminar, actualizar, fechaATimestamp } from '../services/firestore'
import { Alerta, Spinner, Vacio, Confirmar, Modal } from '../components/ui'
import { IcoHistory, IcoDownload, IcoTrash, IcoEdit } from '../components/Icons'
import { exportarViajesExcel } from '../services/excel'
import { pesos, km, minutos, litros, fechaCorta, fechaInput } from '../services/formato'

export default function Historial() {
  const { user, perfil, equipo } = useAuth()
  const esAdmin = perfil?.role === 'admin'

  const [periodo, setPeriodo] = useState(rangoMesActual())
  const [vista, setVista] = useState('propios') // propios | equipo (solo admin)
  const [miembroFiltro, setMiembroFiltro] = useState('todos')
  const [vehiculoFiltro, setVehiculoFiltro] = useState('todos')
  const [viajes, setViajes] = useState([])
  const [miembros, setMiembros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aBorrar, setABorrar] = useState(null)
  const [aEditar, setAEditar] = useState(null)

  const { items: vehiculos } = useColeccion('vehicles')

  const cargar = useCallback(async () => {
    setCargando(true); setError('')
    try {
      const desde = new Date(periodo.desde + 'T00:00:00')
      const hasta = new Date(periodo.hasta + 'T23:59:59')
      let lista
      if (esAdmin && vista === 'equipo' && equipo) {
        lista = await viajesDeEquipo(equipo.id, desde, hasta)
        if (miembros.length === 0) {
          try { setMiembros(await miembrosDeEquipo(equipo.id)) } catch (e) { /* reglas */ }
        }
      } else {
        lista = await viajesPropios(user.uid, desde, hasta)
      }
      setViajes(lista)
    } catch (e) {
      setError('No se pudieron cargar los viajes. Revisá tu conexión.')
    } finally {
      setCargando(false)
    }
  }, [periodo, vista, esAdmin, equipo, user, miembros.length])

  useEffect(() => { cargar() }, [cargar])

  const nombrePorUid = {}
  miembros.forEach((m) => { nombrePorUid[m.id] = m.displayName || m.email })

  const filtrados = viajes.filter((v) => {
    if (vista === 'equipo' && miembroFiltro !== 'todos' && v.userId !== miembroFiltro) return false
    if (vehiculoFiltro !== 'todos' && v.vehicleId !== vehiculoFiltro) return false
    return true
  })

  function exportar() {
    if (filtrados.length === 0) return
    const nombre = `viajes_${periodo.desde}_a_${periodo.hasta}.xlsx`
    exportarViajesExcel(filtrados, nombre, nombrePorUid)
  }

  async function confirmarBorrar() {
    await eliminar('trips', aBorrar.id)
    setABorrar(null)
    await cargar()
  }

  return (
    <div>
      <div className="section-title">Historial de viajes</div>

      <div className="card">
        {esAdmin && equipo && (
          <div className="segmented mb">
            <button className={vista === 'propios' ? 'on' : ''} onClick={() => setVista('propios')}>Mis viajes</button>
            <button className={vista === 'equipo' ? 'on' : ''} onClick={() => setVista('equipo')}>Equipo</button>
          </div>
        )}
        <div className="row">
          <div className="field">
            <label>Desde</label>
            <input type="date" value={periodo.desde} onChange={(e) => setPeriodo({ ...periodo, desde: e.target.value })} />
          </div>
          <div className="field">
            <label>Hasta</label>
            <input type="date" value={periodo.hasta} onChange={(e) => setPeriodo({ ...periodo, hasta: e.target.value })} />
          </div>
        </div>
        <div className="btn-row">
          <button className="btn secundario chico" onClick={() => setPeriodo(rangoHoy())}>Hoy</button>
          <button className="btn secundario chico" onClick={() => setPeriodo(rangoMesActual())}>Este mes</button>
        </div>
        <div className="row mt">
          <div className="field">
            <label>Vehículo</label>
            <select value={vehiculoFiltro} onChange={(e) => setVehiculoFiltro(e.target.value)}>
              <option value="todos">Todos</option>
              {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.modelo || v.categoria}</option>)}
            </select>
          </div>
          {vista === 'equipo' && (
            <div className="field">
              <label>Miembro</label>
              <select value={miembroFiltro} onChange={(e) => setMiembroFiltro(e.target.value)}>
                <option value="todos">Todos</option>
                {miembros.map((m) => <option key={m.id} value={m.id}>{m.displayName || m.email}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb">
          <h2 style={{ margin: 0 }}>{filtrados.length} viaje(s)</h2>
          <button className="btn secundario auto chico" onClick={exportar} disabled={filtrados.length === 0}>
            <IcoDownload /> Exportar Excel
          </button>
        </div>

        {error && <Alerta tipo="error">{error}</Alerta>}
        {cargando ? <Spinner /> : filtrados.length === 0 ? (
          <Vacio icono={<IcoHistory />} titulo="No hay viajes en este período">Registrá un viaje desde la sección Comparar.</Vacio>
        ) : (
          <div className="tabla-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Fecha</th>
                  {vista === 'equipo' && <th>Usuario</th>}
                  <th>Vehículo</th>
                  <th>Origen</th>
                  <th>Destinos</th>
                  <th>I/V</th>
                  <th>Km</th>
                  <th>Tiempo</th>
                  <th>Litros</th>
                  <th>$ Comb.</th>
                  <th>Total</th>
                  <th>Notas</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((v) => (
                  <tr key={v.id}>
                    <td>{fechaCorta(v.fecha?.seconds ? v.fecha.seconds * 1000 : v.fecha)}</td>
                    {vista === 'equipo' && <td>{nombrePorUid[v.userId] || '—'}</td>}
                    <td>{v.vehiculoNombre || '—'}</td>
                    <td>{v.origen?.nombre || '—'}</td>
                    <td>{(v.destinos || []).map((d) => d.nombre).join(' → ')}</td>
                    <td>{v.idaYVuelta ? 'Sí' : 'No'}</td>
                    <td>{km(v.distanciaKm)}</td>
                    <td>{minutos(v.tiempoMin)}</td>
                    <td>{litros(v.litros)}</td>
                    <td>{pesos(v.costoCombustible)}</td>
                    <td>{pesos(v.costoTotal)}</td>
                    <td>{v.notas || ''}</td>
                    <td>
                      {v.userId === user.uid && (
                        <div className="list-actions">
                          <button className="iconbtn" onClick={() => setAEditar(v)}><IcoEdit /></button>
                          <button className="iconbtn peligro" onClick={() => setABorrar(v)}><IcoTrash /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {aBorrar && (
        <Confirmar titulo="Eliminar viaje" mensaje="¿Eliminar este viaje del historial? No se puede deshacer."
          onConfirmar={confirmarBorrar} onCancelar={() => setABorrar(null)} />
      )}
      {aEditar && (
        <ModalEditarViaje viaje={aEditar} onCerrar={() => setAEditar(null)} onGuardado={() => { setAEditar(null); cargar() }} />
      )}
    </div>
  )
}

function ModalEditarViaje({ viaje, onCerrar, onGuardado }) {
  const [fecha, setFecha] = useState(fechaInput(viaje.fecha?.seconds ? viaje.fecha.seconds * 1000 : viaje.fecha))
  const [notas, setNotas] = useState(viaje.notas || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function guardar() {
    setGuardando(true); setError('')
    try {
      await actualizar('trips', viaje.id, {
        fecha: fechaATimestamp(new Date(fecha + 'T12:00:00')),
        notas: notas.trim()
      })
      onGuardado()
    } catch (e) { setError('No se pudo guardar.') }
    finally { setGuardando(false) }
  }

  return (
    <Modal titulo="Editar viaje" onClose={onCerrar}>
      {error && <Alerta tipo="error">{error}</Alerta>}
      <div className="field">
        <label>Fecha</label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>
      <div className="field">
        <label>Notas</label>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} />
      </div>
      <div className="btn-row">
        <button className="btn secundario" onClick={onCerrar}>Cancelar</button>
        <button className="btn" onClick={guardar} disabled={guardando}>{guardando ? <Spinner /> : 'Guardar'}</button>
      </div>
    </Modal>
  )
}

function rangoHoy() {
  const hoy = fechaInput(new Date())
  return { desde: hoy, hasta: hoy }
}
function rangoMesActual() {
  const ahora = new Date()
  const primero = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const ultimo = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0)
  return { desde: fechaInput(primero), hasta: fechaInput(ultimo) }
}
