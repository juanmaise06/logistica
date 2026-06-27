// =============================================================================
//  Capa de mapas basada en OpenStreetMap (sin API key, sin tarjeta):
//   - Búsqueda / geocoding: Nominatim (https://nominatim.openstreetmap.org)
//   - Ruteo (distancia + tiempo) y optimización de paradas: OSRM (demo server)
//  Limitaciones vs servicios pagos: el tiempo es ESTIMADO (sin tráfico en vivo)
//  y no hay datos de cortes/incidentes.
//
//  Buenas prácticas de uso: debounce en el autocompletado (lo hace el componente)
//  para respetar el límite de ~1 req/seg de Nominatim.
// =============================================================================

import { PAIS_DEFAULT } from '../config'

export const MAX_WAYPOINTS = 12

const NOMINATIM = 'https://nominatim.openstreetmap.org'
const OSRM = 'https://router.project-osrm.org'

class MapaError extends Error {
  constructor(mensaje, status) {
    super(mensaje)
    this.name = 'MapaError'
    this.status = status
  }
}

async function fetchJson(url) {
  let resp
  try {
    resp = await fetch(url, { headers: { Accept: 'application/json' } })
  } catch (e) {
    throw new MapaError('Sin conexión con el servicio de mapas. Revisá tu internet.', 0)
  }
  if (resp.status === 429) {
    throw new MapaError('Demasiadas consultas seguidas al mapa. Esperá unos segundos y reintentá.', 429)
  }
  if (!resp.ok) {
    throw new MapaError(`El servicio de mapas no respondió (${resp.status}).`, resp.status)
  }
  return resp.json()
}

// --- Autocompletado / búsqueda de direcciones (Nominatim) --------------------
// Devuelve [{ id, nombre, direccion, lat, lng }]
export async function buscarDireccion(texto) {
  const q = (texto || '').trim()
  if (q.length < 3) return []
  const params = new URLSearchParams({
    q,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
    countrycodes: PAIS_DEFAULT.toLowerCase(),
    'accept-language': 'es'
  })
  const data = await fetchJson(`${NOMINATIM}/search?${params}`)
  return (data || []).map((r) => ({
    id: String(r.place_id),
    nombre: nombreCorto(r),
    direccion: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon)
  }))
}

function nombreCorto(r) {
  // Preferimos el nombre propio (POI/calle) o las primeras partes de la dirección.
  if (r.name) return r.name
  const a = r.address || {}
  const partes = [a.road || a.neighbourhood || a.suburb, a.city || a.town || a.village || a.county]
    .filter(Boolean)
  if (partes.length) return partes.join(', ')
  return (r.display_name || '').split(',').slice(0, 2).join(', ')
}

// --- Ruteo (OSRM) ------------------------------------------------------------
// puntos: [{lat,lng}, ...] en orden. Devuelve { distanciaKm, tiempoMin, geometria:[[lng,lat]] }
export async function calcularRuta(puntos) {
  if (!puntos || puntos.length < 2) {
    throw new MapaError('Hace falta al menos un origen y un destino.', 0)
  }
  const coords = puntos.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `${OSRM}/route/v1/driving/${coords}?overview=full&geometries=geojson`
  const data = await fetchJson(url)
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new MapaError('No se encontró una ruta posible entre esos puntos.', 0)
  }
  const ruta = data.routes[0]
  return {
    distanciaKm: ruta.distance / 1000,
    tiempoMin: ruta.duration / 60,
    tiempoSinTraficoMin: ruta.duration / 60,
    demoraTraficoMin: 0, // OSM no provee tráfico en vivo
    geometria: ruta.geometry.coordinates // [[lng,lat], ...]
  }
}

// --- Optimización de orden de paradas (OSRM Trip / TSP) ----------------------
// origen fijo primero; reordena `destinos`. Si idaYVuelta, vuelve al origen.
// Devuelve { orden: [índices de destinos en el nuevo orden] }
export async function optimizarOrden(origen, destinos, fin = null) {
  const idaYVuelta = !!fin
  const total = 1 + destinos.length
  if (total > MAX_WAYPOINTS) {
    throw new MapaError(
      `Demasiadas paradas (${total}). Se pueden optimizar hasta ${MAX_WAYPOINTS} puntos. Quitá algunas.`,
      0
    )
  }
  const coords = [origen, ...destinos].map((p) => `${p.lng},${p.lat}`).join(';')
  const params = new URLSearchParams({
    source: 'first',
    roundtrip: idaYVuelta ? 'true' : 'false',
    overview: 'false'
  })
  // Para ida sola, fijamos el destino final como el último elegido por OSRM.
  if (!idaYVuelta) params.set('destination', 'last')
  const url = `${OSRM}/trip/v1/driving/${coords}?${params}`
  const data = await fetchJson(url)
  if (data.code !== 'Ok' || !data.waypoints?.length) {
    throw new MapaError('No se pudo optimizar el orden de las paradas.', 0)
  }
  // waypoints viene alineado al orden de entrada; waypoint_index = posición óptima.
  const destinosWp = data.waypoints
    .map((w, i) => ({ entrada: i, optimo: w.waypoint_index }))
    .filter((x) => x.entrada >= 1) // 0 es el origen
    .sort((a, b) => a.optimo - b.optimo)
  return { orden: destinosWp.map((x) => x.entrada - 1) }
}

export { MapaError }
