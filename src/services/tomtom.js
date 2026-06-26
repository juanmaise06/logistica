// =============================================================================
//  Capa de acceso a las APIs REST de TomTom.
//  - Search / Autocomplete (geocoding) con debounce desde el componente.
//  - Routing con tráfico en tiempo real.
//  - Waypoint Optimization (máx. 12 waypoints).
//  - Traffic Incidents en un bounding box.
//  Manejo de errores uniforme: lanza Error con mensaje en español.
// =============================================================================

import { TOMTOM_API_KEY, PAIS_DEFAULT } from '../config'

const BASE = 'https://api.tomtom.com'

export const MAX_WAYPOINTS = 12

class TomTomError extends Error {
  constructor(mensaje, status) {
    super(mensaje)
    this.name = 'TomTomError'
    this.status = status
  }
}

async function fetchJson(url, opciones) {
  let resp
  try {
    resp = await fetch(url, opciones)
  } catch (e) {
    throw new TomTomError('Sin conexión con el servicio de mapas. Revisá tu internet.', 0)
  }
  if (resp.status === 403) {
    throw new TomTomError('La clave de TomTom es inválida o no está autorizada para este dominio.', 403)
  }
  if (resp.status === 429) {
    throw new TomTomError('Se alcanzó el límite de uso de TomTom por hoy. Probá más tarde.', 429)
  }
  if (!resp.ok) {
    throw new TomTomError(`Error del servicio de mapas (${resp.status}).`, resp.status)
  }
  return resp.json()
}

// --- Autocompletado / búsqueda de direcciones ---------------------------------
// Devuelve [{ id, nombre, direccion, lat, lng }]
export async function buscarDireccion(texto, { lat, lng } = {}) {
  const q = (texto || '').trim()
  if (q.length < 3) return []
  const params = new URLSearchParams({
    key: TOMTOM_API_KEY,
    countrySet: PAIS_DEFAULT,
    limit: '6',
    language: 'es-ES',
    typeahead: 'true'
  })
  if (typeof lat === 'number' && typeof lng === 'number') {
    params.set('lat', String(lat))
    params.set('lon', String(lng))
  }
  const url = `${BASE}/search/2/search/${encodeURIComponent(q)}.json?${params}`
  const data = await fetchJson(url)
  return (data.results || []).map((r) => ({
    id: r.id,
    nombre: r.poi?.name || r.address?.freeformAddress || q,
    direccion: r.address?.freeformAddress || '',
    lat: r.position.lat,
    lng: r.position.lon
  }))
}

// --- Routing con tráfico ------------------------------------------------------
// puntos: [{lat,lng}, ...] en orden. Devuelve { distanciaKm, tiempoMin, tiempoSinTraficoMin, geometria:[[lng,lat],...] }
export async function calcularRuta(puntos, { traffic = true } = {}) {
  if (!puntos || puntos.length < 2) {
    throw new TomTomError('Hace falta al menos un origen y un destino.', 0)
  }
  const loc = puntos.map((p) => `${p.lat},${p.lng}`).join(':')
  const params = new URLSearchParams({
    key: TOMTOM_API_KEY,
    traffic: traffic ? 'true' : 'false',
    travelMode: 'truck',
    routeType: 'fastest',
    computeTravelTimeFor: 'all'
  })
  const url = `${BASE}/routing/1/calculateRoute/${loc}/json?${params}`
  const data = await fetchJson(url)
  const ruta = data.routes?.[0]
  if (!ruta) throw new TomTomError('No se encontró una ruta posible entre esos puntos.', 0)
  const s = ruta.summary
  const geometria = []
  ;(ruta.legs || []).forEach((leg) => {
    ;(leg.points || []).forEach((pt) => geometria.push([pt.longitude, pt.latitude]))
  })
  return {
    distanciaKm: s.lengthInMeters / 1000,
    tiempoMin: s.travelTimeInSeconds / 60,
    tiempoSinTraficoMin: (s.noTrafficTravelTimeInSeconds ?? s.travelTimeInSeconds) / 60,
    demoraTraficoMin: (s.trafficDelayInSeconds ?? 0) / 60,
    geometria
  }
}

// --- Waypoint Optimization ----------------------------------------------------
// origen, destinos[], opcional fin. Devuelve { orden: [indices de destinos] }
// Respeta el límite de 12 waypoints (origen + destinos + fin).
export async function optimizarOrden(origen, destinos, fin = null) {
  const total = 1 + destinos.length + (fin ? 1 : 0)
  if (total > MAX_WAYPOINTS) {
    throw new TomTomError(
      `Demasiadas paradas (${total}). TomTom permite optimizar hasta ${MAX_WAYPOINTS} puntos. Quitá algunas.`,
      0
    )
  }
  const waypoints = [
    { point: { latitude: origen.lat, longitude: origen.lng } },
    ...destinos.map((d) => ({ point: { latitude: d.lat, longitude: d.lng } }))
  ]
  if (fin) waypoints.push({ point: { latitude: fin.lat, longitude: fin.lng } })

  const body = {
    waypoints,
    options: {
      travelMode: 'truck',
      vehicleMaxSpeed: 110,
      traffic: 'live',
      // El primero es origen fijo; si hay fin, el último es fijo.
      outputExtensions: ['travelTimes', 'routeLengths']
    }
  }
  const url = `${BASE}/routing/waypointoptimization/1?key=${TOMTOM_API_KEY}`
  const data = await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  // data.optimizedOrder es el orden de los índices de waypoints.
  const optimized = data.optimizedOrder || []
  // Filtramos origen (0) y fin (último si existe) para devolver solo el orden de destinos.
  const idxFin = fin ? waypoints.length - 1 : -1
  const orden = optimized
    .filter((i) => i !== 0 && i !== idxFin)
    .map((i) => i - 1) // -1 porque destinos arrancan en índice 1
  return { orden }
}

// --- Traffic Incidents --------------------------------------------------------
// bbox: {minLng,minLat,maxLng,maxLat}. Devuelve [{tipo, descripcion, lat, lng, retrasoMin}]
export async function incidentesEnZona(bbox) {
  const fields =
    '{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code},delay,from,to}}}'
  const params = new URLSearchParams({
    key: TOMTOM_API_KEY,
    bbox: `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`,
    fields,
    language: 'es-ES',
    timeValidityFilter: 'present'
  })
  const url = `${BASE}/traffic/services/5/incidentDetails?${params}`
  let data
  try {
    data = await fetchJson(url)
  } catch (e) {
    // Los incidentes no son críticos: si fallan, devolvemos vacío.
    return []
  }
  const CAT = {
    1: 'Accidente', 2: 'Niebla', 3: 'Peligro', 4: 'Lluvia', 5: 'Hielo',
    6: 'Atasco', 7: 'Carril cerrado', 8: 'Camino cerrado', 9: 'Obras',
    10: 'Viento', 11: 'Inundación', 14: 'Vehículo detenido'
  }
  return (data.incidents || []).map((inc) => {
    const p = inc.properties || {}
    const geo = inc.geometry || {}
    let lng, lat
    if (geo.type === 'Point') {
      ;[lng, lat] = geo.coordinates
    } else if (Array.isArray(geo.coordinates) && geo.coordinates.length) {
      const mid = geo.coordinates[Math.floor(geo.coordinates.length / 2)]
      ;[lng, lat] = mid
    }
    return {
      tipo: CAT[p.iconCategory] || 'Incidente',
      descripcion: p.events?.[0]?.description || 'Incidente de tránsito',
      retrasoMin: Math.round((p.delay || 0) / 60),
      magnitud: p.magnitudeOfDelay || 0,
      lat,
      lng
    }
  })
}

// Calcula bounding box que cubre una lista de puntos, con margen.
export function bboxDePuntos(puntos, margen = 0.05) {
  const lats = puntos.map((p) => p.lat)
  const lngs = puntos.map((p) => p.lng)
  return {
    minLat: Math.min(...lats) - margen,
    maxLat: Math.max(...lats) + margen,
    minLng: Math.min(...lngs) - margen,
    maxLng: Math.max(...lngs) + margen
  }
}

export { TomTomError }
