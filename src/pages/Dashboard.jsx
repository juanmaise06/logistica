import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { viajesPropios } from '../services/firestore'
import { Alerta, Spinner, Vacio } from '../components/ui'
import { IcoDash } from '../components/Icons'
import { pesos, km, litros, minutos, num, fechaInput } from '../services/formato'

const COLORES = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c']

export default function Dashboard() {
  const { user } = useAuth()
  const [periodo, setPeriodo] = useState(rangoMesActual())
  const [viajes, setViajes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true); setError('')
    try {
      const desde = new Date(periodo.desde + 'T00:00:00')
      const hasta = new Date(periodo.hasta + 'T23:59:59')
      setViajes(await viajesPropios(user.uid, desde, hasta))
    } catch (e) {
      setError('No se pudieron cargar los datos. Revisá tu conexión.')
    } finally { setCargando(false) }
  }, [periodo, user])

  useEffect(() => { cargar() }, [cargar])

  // Totales.
  const tot = viajes.reduce((a, v) => ({
    litros: a.litros + (v.litros || 0),
    combustible: a.combustible + (v.costoCombustible || 0),
    km: a.km + (v.distanciaKm || 0),
    min: a.min + (v.tiempoMin || 0),
    total: a.total + (v.costoTotal || 0)
  }), { litros: 0, combustible: 0, km: 0, min: 0, total: 0 })
  const cant = viajes.length

  // Gasto por día.
  const porDiaMap = {}
  viajes.forEach((v) => {
    const d = new Date(v.fecha?.seconds ? v.fecha.seconds * 1000 : v.fecha)
    const k = fechaInput(d)
    porDiaMap[k] = (porDiaMap[k] || 0) + (v.costoCombustible || 0)
  })
  const porDia = Object.entries(porDiaMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, val]) => ({ dia: k.slice(5), gasto: Math.round(val) }))

  // Distribución por vehículo (litros).
  const porVehMap = {}
  viajes.forEach((v) => {
    const k = v.vehiculoNombre || 'Sin vehículo'
    porVehMap[k] = (porVehMap[k] || 0) + (v.litros || 0)
  })
  const porVeh = Object.entries(porVehMap).map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))

  return (
    <div>
      <div className="section-title">Panel de consumo</div>

      <div className="card">
        <div className="btn-row mb">
          <button className="btn secundario chico" onClick={() => setPeriodo(rangoHoy())}>Hoy</button>
          <button className="btn secundario chico" onClick={() => setPeriodo(rangoMesActual())}>Este mes</button>
        </div>
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
      </div>

      {error && <Alerta tipo="error">{error}</Alerta>}

      {cargando ? (
        <div className="card"><Spinner /> Cargando…</div>
      ) : cant === 0 ? (
        <div className="card">
          <Vacio icono={<IcoDash />} titulo="No hay viajes en este período">Registrá viajes para ver tus consumos y promedios.</Vacio>
        </div>
      ) : (
        <>
          <div className="card">
            <h2>Totales del período</h2>
            <div className="metric-grid">
              <div className="metric"><div className="lbl">Viajes</div><div className="val">{cant}</div></div>
              <div className="metric"><div className="lbl">Km recorridos</div><div className="val">{km(tot.km)}</div></div>
              <div className="metric"><div className="lbl">Horas de viaje</div><div className="val">{num(tot.min / 60, 1)} h</div></div>
              <div className="metric"><div className="lbl">Litros</div><div className="val">{litros(tot.litros)}</div></div>
            </div>
            <div className="metric-grid mt">
              <div className="metric"><div className="lbl">$ Combustible</div><div className="val">{pesos(tot.combustible)}</div></div>
              <div className="metric"><div className="lbl">Costo total</div><div className="val">{pesos(tot.total)}</div></div>
              <div className="metric"><div className="lbl">Promedio $/viaje</div><div className="val sm">{pesos(tot.total / cant)}</div></div>
              <div className="metric"><div className="lbl">Promedio km/viaje</div><div className="val sm">{km(tot.km / cant)}</div></div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h2>Gasto de combustible por día</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={porDia} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="dia" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
                    formatter={(v) => [pesos(v), 'Gasto']}
                  />
                  <Bar dataKey="gasto" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2>Litros por vehículo</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={porVeh} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.name}: ${e.value} L`}>
                    {porVeh.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
                    formatter={(v) => [`${v} L`, 'Litros']}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
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
