import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useColeccion } from '../hooks/useColeccion'
import { Alerta, Spinner, Vacio, Modal } from '../components/ui'
import { IcoCompare, IcoPlus, IcoTrash, IcoX, IcoOptim, IcoStar, IcoRoute, IcoCheck } from '../components/Icons'
import SelectorLugar from '../components/SelectorLugar'
import MapaOSM from '../components/MapaOSM'
import { calcularRuta, optimizarOrden } from '../services/mapas'
import { calcularEscenario, recomendar } from '../services/calculo'
import { crearViaje, fechaATimestamp } from '../services/firestore'
import { pesos, km, minutos, litros, num, fechaInput } from '../services/formato'

let _id = 0
const nuevoEscenario = (n) => ({ uid: ++_id, nombre: `Opción ${n}`, origen: null, destinos: [], idaYVuelta: true })

export default function Comparar() {
  const { user, perfil, equipo } = useAuth()
  const { items: vehiculos, cargando: cargVeh } = useColeccion('vehicles')
  const { items: combustibles } = useColeccion('fuelTypes')
  const { items: lugares } = useColeccion('places')

  const [vehiculoId, setVehiculoId] = useState('')
  const [escenarios, setEscenarios] = useState([nuevoEscenario(1), nuevoEscenario(2)])
  const [resultados, setResultados] = useState(null) // [{ nombre, calc, incidentes, geometria, puntos }]
  const [recomendacion, setRecomendacion] = useState(null)
  const [calculando, setCalculando] = useState(false)
  const [error, setError] = useState('')
  const [registrar, setRegistrar] = useState(null) // escenario a registrar

  const vehiculo = vehiculos.find((v) => v.id === vehiculoId)
  const combustible = vehiculo ? combustibles.find((c) => c.id === vehiculo.fuelTypeId) : null

  function actualizarEsc(uid, cambios) {
    setEscenarios((arr) => arr.map((e) => (e.uid === uid ? { ...e, ...cambios } : e)))
  }
  function agregarEscenario() {
    if (escenarios.length >= 4) return
    setEscenarios((arr) => [...arr, nuevoEscenario(arr.length + 1)])
  }
  function quitarEscenario(uid) {
    setEscenarios((arr) => (arr.length <= 1 ? arr : arr.filter((e) => e.uid !== uid)))
  }

  // Puntos ordenados de un escenario: origen, destinos..., (origen si ida y vuelta)
  function puntosDe(esc) {
    const pts = [esc.origen, ...esc.destinos].filter(Boolean)
    if (esc.idaYVuelta && esc.origen) pts.push(esc.origen)
    return pts
  }

  async function calcularTodo() {
    setError('')
    if (!vehiculo) { setError('Elegí un vehículo.'); return }
    if (!combustible) { setError('El vehículo elegido no tiene combustible asignado. Asignale uno en Vehículos.'); return }
    const validos = escenarios.filter((e) => e.origen && e.destinos.length > 0)
    if (validos.length === 0) { setError('Cargá al menos un escenario con origen y un destino.'); return }

    setCalculando(true)
    setResultados(null); setRecomendacion(null)
    try {
      const res = []
      for (const esc of validos) {
        const ptsRuta = puntosDe(esc)
        const ruta = await calcularRuta(ptsRuta)
        const calc = calcularEscenario(ruta, {
          idaYVuelta: esc.idaYVuelta,
          consumoL100: vehiculo.consumoL100,
          precioLitro: combustible.precioPorLitro,
          valorHora: perfil?.valorHora || 0
        })
        res.push({
          escUid: esc.uid,
          nombre: esc.nombre,
          esc,
          ruta,
          calc,
          geometria: ruta.geometria,
          // Marcadores: origen + destinos (sin repetir el de vuelta)
          puntos: [esc.origen, ...esc.destinos]
        })
      }
      setResultados(res)
      setRecomendacion(recomendar(res.map((r) => ({ nombre: r.nombre, calc: r.calc, incidentes: [], escUid: r.escUid }))))
    } catch (e) {
      setError(e.message || 'No se pudo calcular.')
    } finally {
      setCalculando(false)
    }
  }

  // Datos para el mapa: todas las rutas.
  const rutasMapa = (resultados || []).map((r) => ({ nombre: r.nombre, geometria: r.geometria, puntos: r.puntos }))

  if (cargVeh) return <div className="card"><Spinner /> Cargando…</div>

  if (vehiculos.length === 0) {
    return (
      <div>
        <div className="section-title">Comparar recorridos</div>
        <div className="card">
          <Vacio icono={<IcoCompare />} titulo="Necesitás cargar un vehículo">
            Para comparar viajes primero agregá un vehículo (y un combustible) en sus secciones.
          </Vacio>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="section-title">Comparar recorridos</div>
      <p className="muted" style={{ marginTop: -8 }}>Armá dos o más opciones y decidí a dónde te conviene ir a buscar.</p>

      {error && <Alerta tipo="error" onClose={() => setError('')}>{error}</Alerta>}

      <div className="card">
        <div className="field">
          <label>Vehículo</label>
          <select value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)}>
            <option value="">Elegí un vehículo…</option>
            {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.modelo || v.categoria} {v.anio ? `(${v.anio})` : ''} — {num(v.consumoL100, 1)} L/100km</option>)}
          </select>
          {vehiculo && !combustible && <div className="hint" style={{ color: 'var(--danger)' }}>Este vehículo no tiene combustible asignado.</div>}
          {combustible && <div className="hint">Combustible: {combustible.nombre} · {pesos(combustible.precioPorLitro)}/L · Valor tiempo: {perfil?.valorHora ? pesos(perfil.valorHora) + '/h' : 'sin contar (0)'}</div>}
        </div>
      </div>

      <div className={`escenarios ${escenarios.length === 2 ? 'dos' : ''}`}>
        {escenarios.map((esc) => (
          <EditorEscenario
            key={esc.uid}
            esc={esc}
            lugares={lugares}
            onCambio={(c) => actualizarEsc(esc.uid, c)}
            onQuitar={escenarios.length > 1 ? () => quitarEscenario(esc.uid) : null}
            setError={setError}
          />
        ))}
      </div>

      <div className="btn-row mb">
        {escenarios.length < 4 && <button className="btn secundario" onClick={agregarEscenario}><IcoPlus /> Agregar otra opción</button>}
        <button className="btn" onClick={calcularTodo} disabled={calculando}>
          {calculando ? <><Spinner /> Calculando…</> : <><IcoRoute /> Calcular y comparar</>}
        </button>
      </div>

      {recomendacion && (
        <div className="recomendacion">
          <div className="titulo"><IcoStar /> Recomendación</div>
          <div className="frase">{recomendacion.frase}</div>
        </div>
      )}

      {resultados && (
        <>
          <div className={`escenarios ${resultados.length === 2 ? 'dos' : ''}`}>
            {resultados.map((r) => {
              const esGanador = recomendacion?.ganadorNombre === r.nombre
              return (
                <div className={`escenario ${esGanador ? 'ganador' : ''}`} key={r.escUid}>
                  <div className="esc-head">
                    <h2 style={{ margin: 0, fontSize: '1.05rem' }}>{r.nombre}</h2>
                    {esGanador && <span className="badge admin"><IcoStar style={{ width: 12, height: 12 }} /> Conviene</span>}
                  </div>
                  <div className="metric-grid">
                    <div className="metric"><div className="lbl">Tiempo</div><div className="val sm">{minutos(r.calc.tiempoMin)}</div></div>
                    <div className="metric"><div className="lbl">Distancia</div><div className="val sm">{km(r.calc.distanciaKm)}</div></div>
                    <div className="metric"><div className="lbl">Combustible</div><div className="val sm">{litros(r.calc.litros)}</div></div>
                    <div className="metric"><div className="lbl">$ Combustible</div><div className="val sm">{pesos(r.calc.costoCombustible)}</div></div>
                  </div>
                  <div className="metric-grid mt">
                    {perfil?.valorHora > 0 && <div className="metric"><div className="lbl">$ Tiempo</div><div className="val sm">{pesos(r.calc.costoTiempo)}</div></div>}
                    <div className="metric" style={{ gridColumn: perfil?.valorHora > 0 ? 'span 2' : 'span 4' }}>
                      <div className="lbl">Costo total</div><div className="val">{pesos(r.calc.costoTotal)}</div>
                    </div>
                  </div>
                  <button className="btn exito mt" onClick={() => setRegistrar(r)}>
                    <IcoCheck /> Registrar este viaje
                  </button>
                </div>
              )
            })}
          </div>

          <div className="card">
            <h2>Mapa del recorrido</h2>
            <p className="sub">Las rutas de cada opción se muestran en distintos colores. El tiempo es estimado (sin tráfico en vivo).</p>
            <MapaOSM rutas={rutasMapa} />
          </div>
        </>
      )}

      {registrar && (
        <ModalRegistrar
          resultado={registrar}
          vehiculo={vehiculo}
          combustible={combustible}
          userId={user.uid}
          teamId={perfil?.teamId || equipo?.id || null}
          onCerrar={() => setRegistrar(null)}
        />
      )}
    </div>
  )
}

// ---------------- Editor de un escenario ----------------
function EditorEscenario({ esc, lugares, onCambio, onQuitar, setError }) {
  const [optimizando, setOptimizando] = useState(false)

  function setOrigen(p) { onCambio({ origen: p }) }
  function agregarDestino(p) { onCambio({ destinos: [...esc.destinos, p] }) }
  function quitarDestino(i) { onCambio({ destinos: esc.destinos.filter((_, idx) => idx !== i) }) }
  function mover(i, dir) {
    const arr = [...esc.destinos]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    onCambio({ destinos: arr })
  }

  async function optimizar() {
    if (esc.destinos.length < 2) { setError('Necesitás al menos 2 destinos para optimizar el orden.'); return }
    if (!esc.origen) { setError('Definí el origen antes de optimizar.'); return }
    setOptimizando(true); setError('')
    try {
      const fin = esc.idaYVuelta ? esc.origen : null
      const { orden } = await optimizarOrden(esc.origen, esc.destinos, fin)
      if (orden.length === esc.destinos.length) {
        onCambio({ destinos: orden.map((i) => esc.destinos[i]) })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setOptimizando(false)
    }
  }

  return (
    <div className="card">
      <div className="esc-head">
        <input
          value={esc.nombre}
          onChange={(e) => onCambio({ nombre: e.target.value })}
          style={{ fontWeight: 700, maxWidth: 200 }}
        />
        {onQuitar && <button className="iconbtn peligro" onClick={onQuitar}><IcoX /></button>}
      </div>

      <div className="field">
        <label>Origen (punto de partida)</label>
        <SelectorLugar lugaresGuardados={lugares} onElegir={setOrigen} placeholder="Buscar origen…" />
        {esc.origen && <div className="chip mt">📍 {esc.origen.nombre}</div>}
      </div>

      <div className="field">
        <label>Destinos / paradas</label>
        <SelectorLugar lugaresGuardados={lugares} onElegir={agregarDestino} placeholder="Agregar destino…" />
      </div>

      {esc.destinos.length > 0 && (
        <div className="mb">
          {esc.destinos.map((d, i) => (
            <div className="list-item" key={i} style={{ padding: 8 }}>
              <span className="tag-orden">{i + 1}</span>
              <div className="grow"><div className="titulo" style={{ fontSize: '0.9rem' }}>{d.nombre}</div></div>
              <div className="list-actions">
                <button className="iconbtn" onClick={() => mover(i, -1)} disabled={i === 0} title="Subir">↑</button>
                <button className="iconbtn" onClick={() => mover(i, 1)} disabled={i === esc.destinos.length - 1} title="Bajar">↓</button>
                <button className="iconbtn peligro" onClick={() => quitarDestino(i)}><IcoTrash /></button>
              </div>
            </div>
          ))}
          {esc.destinos.length >= 2 && (
            <button className="btn secundario chico mt" onClick={optimizar} disabled={optimizando}>
              {optimizando ? <Spinner /> : <><IcoOptim /> Optimizar orden</>}
            </button>
          )}
        </div>
      )}

      <label className="chip" style={{ cursor: 'pointer', width: '100%' }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={esc.idaYVuelta} onChange={(e) => onCambio({ idaYVuelta: e.target.checked })} />
        Ida y vuelta (volver al origen)
      </label>
    </div>
  )
}

// ---------------- Modal registrar viaje ----------------
function ModalRegistrar({ resultado, vehiculo, combustible, userId, teamId, onCerrar }) {
  const [fecha, setFecha] = useState(fechaInput(new Date()))
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  async function confirmar() {
    setGuardando(true); setError('')
    try {
      const esc = resultado.esc
      await crearViaje(userId, teamId, {
        fecha: fechaATimestamp(new Date(fecha + 'T12:00:00')),
        vehicleId: vehiculo.id,
        vehiculoNombre: `${vehiculo.modelo || vehiculo.categoria}${vehiculo.anio ? ' ' + vehiculo.anio : ''}`,
        origen: esc.origen,
        destinos: esc.destinos,
        idaYVuelta: esc.idaYVuelta,
        distanciaKm: resultado.calc.distanciaKm,
        tiempoMin: resultado.calc.tiempoMin,
        litros: resultado.calc.litros,
        costoCombustible: resultado.calc.costoCombustible,
        costoTiempo: resultado.calc.costoTiempo,
        costoTotal: resultado.calc.costoTotal,
        combustibleNombre: combustible?.nombre || '',
        notas: notas.trim()
      })
      setOk(true)
      setTimeout(onCerrar, 1200)
    } catch (e) {
      setError('No se pudo registrar el viaje. Revisá tu conexión.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Registrar viaje realizado" onClose={onCerrar}>
      {ok ? (
        <Alerta tipo="ok">✓ Viaje registrado en tu historial.</Alerta>
      ) : (
        <>
          <p className="muted" style={{ marginTop: 0 }}>Vas a registrar <strong>{resultado.nombre}</strong>: {km(resultado.calc.distanciaKm)}, {minutos(resultado.calc.tiempoMin)}, {pesos(resultado.calc.costoTotal)}.</p>
          {error && <Alerta tipo="error">{error}</Alerta>}
          <div className="field">
            <label>Fecha del viaje</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="field">
            <label>Notas (opcional)</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: cargué 800 kg, esperé 30 min…" />
          </div>
          <div className="btn-row">
            <button className="btn secundario" onClick={onCerrar}>Cancelar</button>
            <button className="btn exito" onClick={confirmar} disabled={guardando}>{guardando ? <Spinner /> : 'Confirmar registro'}</button>
          </div>
        </>
      )}
    </Modal>
  )
}
