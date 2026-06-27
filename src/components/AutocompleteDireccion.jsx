import { useState, useEffect, useRef } from 'react'
import { buscarDireccion } from '../services/mapas'
import { Spinner } from './ui'

// Input con autocompletado de direcciones (Nominatim/OSM) + debounce.
// onSeleccion({ nombre, direccion, lat, lng })
export default function AutocompleteDireccion({ onSeleccion, placeholder = 'Escribí una dirección o localidad…', valorInicial = '' }) {
  const [texto, setTexto] = useState(valorInicial)
  const [sugerencias, setSugerencias] = useState([])
  const [abierto, setAbierto] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    function onClickFuera(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', onClickFuera)
    return () => document.removeEventListener('mousedown', onClickFuera)
  }, [])

  function onChange(e) {
    const v = e.target.value
    setTexto(v)
    setError('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (v.trim().length < 3) {
      setSugerencias([]); setAbierto(false)
      return
    }
    // Debounce de 650ms: respeta el límite de Nominatim (~1 req/seg) y no
    // dispara una búsqueda en cada tecla.
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const res = await buscarDireccion(v)
        setSugerencias(res)
        setAbierto(true)
      } catch (err) {
        setError(err.message)
        setSugerencias([])
      } finally {
        setBuscando(false)
      }
    }, 650)
  }

  function elegir(s) {
    setTexto(s.nombre)
    setAbierto(false)
    setSugerencias([])
    onSeleccion(s)
  }

  return (
    <div className="autocomplete" ref={wrapRef}>
      <input
        value={texto}
        onChange={onChange}
        onFocus={() => sugerencias.length && setAbierto(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {buscando && (
        <span style={{ position: 'absolute', right: 12, top: 11 }}><Spinner /></span>
      )}
      {abierto && sugerencias.length > 0 && (
        <div className="sugerencias">
          {sugerencias.map((s) => (
            <div key={s.id} className="sug" onClick={() => elegir(s)}>
              <div className="n">{s.nombre}</div>
              <div className="d">{s.direccion}</div>
            </div>
          ))}
        </div>
      )}
      {abierto && !buscando && sugerencias.length === 0 && texto.trim().length >= 3 && (
        <div className="sugerencias"><div className="sug d">Sin resultados.</div></div>
      )}
      {error && <div className="hint" style={{ color: 'var(--danger)' }}>{error}</div>}
    </div>
  )
}
