import { useState } from 'react'
import AutocompleteDireccion from './AutocompleteDireccion'

// Permite elegir un lugar guardado (un toque) o buscar una dirección nueva.
// onElegir({ nombre, direccion, lat, lng })
export default function SelectorLugar({ lugaresGuardados = [], onElegir, placeholder }) {
  const [modo, setModo] = useState('guardado') // guardado | buscar

  return (
    <div>
      <div className="segmented" style={{ marginBottom: 8 }}>
        <button type="button" className={modo === 'guardado' ? 'on' : ''} onClick={() => setModo('guardado')}>Lugar guardado</button>
        <button type="button" className={modo === 'buscar' ? 'on' : ''} onClick={() => setModo('buscar')}>Buscar dirección</button>
      </div>
      {modo === 'guardado' ? (
        lugaresGuardados.length === 0 ? (
          <p className="hint">No tenés lugares guardados. Usá "Buscar dirección" o agregá lugares en la sección Lugares.</p>
        ) : (
          <select
            defaultValue=""
            onChange={(e) => {
              const l = lugaresGuardados.find((x) => x.id === e.target.value)
              if (l) onElegir({ nombre: l.nombre, direccion: l.direccion, lat: l.lat, lng: l.lng })
            }}
          >
            <option value="">Elegí un lugar…</option>
            {lugaresGuardados.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        )
      ) : (
        <AutocompleteDireccion onSeleccion={onElegir} placeholder={placeholder} />
      )}
    </div>
  )
}
