import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CENTRO_DEFAULT } from '../config'

const COLORES = ['#38bdf8', '#f472b6', '#fbbf24', '#34d399']

// Mapa con Leaflet + tiles oscuros de CARTO (gratis, combinan con el tema).
// Dibuja las rutas de cada escenario (geometría) con color y los marcadores.
//
// props:
//  rutas: [{ nombre, geometria:[[lng,lat]], puntos:[{lat,lng,nombre}] }]
export default function MapaOSM({ rutas = [] }) {
  const cont = useRef(null)
  const mapRef = useRef(null)
  const capasRef = useRef([])

  // Inicializa el mapa una sola vez.
  useEffect(() => {
    if (mapRef.current) return
    const map = L.map(cont.current, { zoomControl: true, attributionControl: true })
      .setView([CENTRO_DEFAULT.lat, CENTRO_DEFAULT.lng], 10)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map)
    mapRef.current = map
    // Leaflet a veces necesita recalcular tamaño tras montarse en un contenedor flex.
    setTimeout(() => map.invalidateSize(), 200)
  }, [])

  // Redibuja cuando cambian las rutas.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Limpiar capas anteriores.
    capasRef.current.forEach((c) => map.removeLayer(c))
    capasRef.current = []

    const todos = []
    rutas.forEach((r, i) => {
      const color = COLORES[i % COLORES.length]
      if (r.geometria && r.geometria.length > 1) {
        const latlngs = r.geometria.map((c) => [c[1], c[0]]) // [lng,lat] -> [lat,lng]
        const linea = L.polyline(latlngs, { color, weight: 5, opacity: 0.85 }).addTo(map)
        capasRef.current.push(linea)
        latlngs.forEach((ll) => todos.push(ll))
      }
      ;(r.puntos || []).forEach((p, idx) => {
        if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return
        const etiqueta = idx === 0 ? 'O' : String(idx)
        const icon = L.divIcon({
          className: 'marcador-mapa',
          html: `<div style="background:${color};color:#04222e;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid #04222e;box-shadow:0 2px 6px rgba(0,0,0,.4)"><span style="transform:rotate(45deg);font-weight:700;font-size:12px">${etiqueta}</span></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 26]
        })
        const marker = L.marker([p.lat, p.lng], { icon })
          .addTo(map)
          .bindPopup(`<strong>${p.nombre || (idx === 0 ? 'Origen' : 'Parada ' + idx)}</strong>`)
        capasRef.current.push(marker)
        todos.push([p.lat, p.lng])
      })
    })

    if (todos.length > 1) {
      try { map.fitBounds(L.latLngBounds(todos), { padding: [40, 40], maxZoom: 14 }) } catch (e) { /* ignore */ }
    } else if (todos.length === 1) {
      map.setView(todos[0], 13)
    }
    setTimeout(() => map.invalidateSize(), 100)
  }, [rutas])

  return <div className="mapa" ref={cont} />
}
