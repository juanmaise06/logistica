import { useEffect, useRef } from 'react'
import tt from '@tomtom-international/web-sdk-maps'
import '@tomtom-international/web-sdk-maps/dist/maps.css'
import { TOMTOM_API_KEY, CENTRO_DEFAULT } from '../config'

const COLORES = ['#38bdf8', '#f472b6', '#fbbf24', '#34d399']

// Muestra el mapa con: capa de tráfico en vivo (raster flow), las rutas de cada
// escenario (geometrías) con color, marcadores de origen/destinos e incidentes.
//
// props:
//  rutas: [{ nombre, geometria:[[lng,lat]], puntos:[{lat,lng,nombre}] }]
//  incidentes: [{ lat, lng, tipo, descripcion }]
export default function MapaTomTom({ rutas = [], incidentes = [] }) {
  const cont = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const listoRef = useRef(false)

  // Inicializa el mapa una sola vez.
  useEffect(() => {
    if (mapRef.current) return
    const map = tt.map({
      key: TOMTOM_API_KEY,
      container: cont.current,
      center: [CENTRO_DEFAULT.lng, CENTRO_DEFAULT.lat],
      zoom: 9,
      style: 'https://api.tomtom.com/style/1/style/22.2.1-*?map=2/basic_night&traffic_incidents=2/incidents_night&traffic_flow=2/flow_relative-night'
    })
    map.addControl(new tt.NavigationControl())
    map.addControl(new tt.FullscreenControl())
    map.on('load', () => {
      listoRef.current = true
      dibujar()
    })
    mapRef.current = map
    return () => { /* mantenemos el mapa vivo mientras el componente exista */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redibuja cuando cambian rutas/incidentes.
  useEffect(() => {
    if (listoRef.current) dibujar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rutas, incidentes])

  function limpiar() {
    const map = mapRef.current
    // Quitar capas/fuentes de rutas previas.
    rutas.forEach((_, i) => {
      const lid = `ruta-${i}`
      if (map.getLayer(lid)) map.removeLayer(lid)
      if (map.getSource(lid)) map.removeSource(lid)
    })
    // Quitar todas las capas ruta-* que hayan quedado.
    for (let i = 0; i < 8; i++) {
      const lid = `ruta-${i}`
      if (map.getLayer(lid)) map.removeLayer(lid)
      if (map.getSource(lid)) map.removeSource(lid)
    }
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
  }

  function dibujar() {
    const map = mapRef.current
    if (!map) return
    limpiar()

    const todosPuntos = []

    rutas.forEach((r, i) => {
      const color = COLORES[i % COLORES.length]
      if (r.geometria && r.geometria.length > 1) {
        const lid = `ruta-${i}`
        map.addSource(lid, {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: r.geometria } }
        })
        map.addLayer({
          id: lid,
          type: 'line',
          source: lid,
          paint: { 'line-color': color, 'line-width': 5, 'line-opacity': 0.85 }
        })
        r.geometria.forEach((c) => todosPuntos.push(c))
      }
      // Marcadores de puntos (origen + destinos).
      ;(r.puntos || []).forEach((p, idx) => {
        const el = document.createElement('div')
        el.style.cssText = `background:${color};color:#04222e;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid #04222e;box-shadow:0 2px 6px rgba(0,0,0,.4)`
        const span = document.createElement('span')
        span.style.transform = 'rotate(45deg)'
        span.style.fontSize = '12px'
        span.textContent = idx === 0 ? 'O' : String(idx)
        el.appendChild(span)
        const marker = new tt.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([p.lng, p.lat])
          .setPopup(new tt.Popup({ offset: 30 }).setHTML(`<strong>${p.nombre || (idx === 0 ? 'Origen' : 'Parada ' + idx)}</strong>`))
          .addTo(map)
        markersRef.current.push(marker)
        todosPuntos.push([p.lng, p.lat])
      })
    })

    // Marcadores de incidentes.
    incidentes.forEach((inc) => {
      if (typeof inc.lat !== 'number' || typeof inc.lng !== 'number') return
      const el = document.createElement('div')
      el.style.cssText = 'width:22px;height:22px;background:#fbbf24;border:2px solid #3a2c00;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px'
      el.textContent = '⚠'
      const marker = new tt.Marker({ element: el })
        .setLngLat([inc.lng, inc.lat])
        .setPopup(new tt.Popup({ offset: 18 }).setHTML(`<strong>${inc.tipo}</strong><br/>${inc.descripcion}`))
        .addTo(map)
      markersRef.current.push(marker)
    })

    // Ajustar el encuadre a todos los puntos.
    if (todosPuntos.length > 1) {
      const lngs = todosPuntos.map((c) => c[0])
      const lats = todosPuntos.map((c) => c[1])
      const bounds = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]]
      try { map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 600 }) } catch (e) { /* ignore */ }
    }
  }

  return <div className="mapa" ref={cont} />
}
