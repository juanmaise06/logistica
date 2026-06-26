// =============================================================================
//  Tabla interna de consumo aproximado (L/100km) para modelos comunes en AR.
//  Valores orientativos de consumo mixto. SIEMPRE editables por el usuario.
//  Para ampliar: agregá entradas a MODELOS o ajustá CATEGORIAS.
// =============================================================================

// Categorías disponibles y su consumo típico (fallback cuando no hay modelo).
export const CATEGORIAS = [
  { id: 'auto_chico', nombre: 'Auto chico', consumoTipico: 6.5 },
  { id: 'sedan', nombre: 'Sedán', consumoTipico: 8.0 },
  { id: 'utilitario', nombre: 'Utilitario', consumoTipico: 9.0 },
  { id: 'camioneta', nombre: 'Camioneta / Pick-up', consumoTipico: 11.0 },
  { id: 'camion_liviano', nombre: 'Camión liviano', consumoTipico: 16.0 }
]

// Modelos conocidos. `match` se compara en minúsculas contra el modelo tipeado.
// `base` es el consumo de referencia; se ajusta levemente por antigüedad.
export const MODELOS = [
  // --- Utilitarios chicos ---
  { match: 'fiorino', categoria: 'utilitario', base: 7.5, label: 'Fiat Fiorino' },
  { match: 'kangoo', categoria: 'utilitario', base: 7.8, label: 'Renault Kangoo' },
  { match: 'partner', categoria: 'utilitario', base: 8.0, label: 'Peugeot Partner' },
  { match: 'berlingo', categoria: 'utilitario', base: 8.0, label: 'Citroën Berlingo' },
  { match: 'doblo', categoria: 'utilitario', base: 8.5, label: 'Fiat Doblò' },
  { match: 'caddy', categoria: 'utilitario', base: 7.8, label: 'VW Caddy' },
  // --- Furgones grandes ---
  { match: 'master', categoria: 'camion_liviano', base: 11.5, label: 'Renault Master' },
  { match: 'sprinter', categoria: 'camion_liviano', base: 12.0, label: 'Mercedes-Benz Sprinter' },
  { match: 'transit', categoria: 'camion_liviano', base: 11.8, label: 'Ford Transit' },
  { match: 'ducato', categoria: 'camion_liviano', base: 12.0, label: 'Fiat Ducato' },
  { match: 'boxer', categoria: 'camion_liviano', base: 12.0, label: 'Peugeot Boxer' },
  { match: 'jumper', categoria: 'camion_liviano', base: 12.0, label: 'Citroën Jumper' },
  { match: 'crafter', categoria: 'camion_liviano', base: 12.2, label: 'VW Crafter' },
  { match: 'daily', categoria: 'camion_liviano', base: 13.0, label: 'Iveco Daily' },
  // --- Pick-ups ---
  { match: 'hilux', categoria: 'camioneta', base: 10.5, label: 'Toyota Hilux' },
  { match: 'amarok', categoria: 'camioneta', base: 11.0, label: 'VW Amarok' },
  { match: 'ranger', categoria: 'camioneta', base: 10.8, label: 'Ford Ranger' },
  { match: 'frontier', categoria: 'camioneta', base: 11.0, label: 'Nissan Frontier' },
  { match: 's10', categoria: 'camioneta', base: 11.0, label: 'Chevrolet S10' },
  { match: 'toro', categoria: 'camioneta', base: 9.0, label: 'Fiat Toro' },
  { match: 'saveiro', categoria: 'camioneta', base: 8.5, label: 'VW Saveiro' },
  { match: 'strada', categoria: 'camioneta', base: 8.0, label: 'Fiat Strada' },
  { match: 'oroch', categoria: 'camioneta', base: 9.0, label: 'Renault Oroch' },
  // --- Autos / sedanes comunes ---
  { match: 'gol', categoria: 'auto_chico', base: 6.5, label: 'VW Gol' },
  { match: 'onix', categoria: 'auto_chico', base: 6.3, label: 'Chevrolet Onix' },
  { match: 'corsa', categoria: 'auto_chico', base: 6.8, label: 'Chevrolet Corsa' },
  { match: 'clio', categoria: 'auto_chico', base: 6.5, label: 'Renault Clio' },
  { match: 'sandero', categoria: 'auto_chico', base: 6.8, label: 'Renault Sandero' },
  { match: 'palio', categoria: 'auto_chico', base: 6.8, label: 'Fiat Palio' },
  { match: 'corolla', categoria: 'sedan', base: 7.0, label: 'Toyota Corolla' },
  { match: 'cronos', categoria: 'sedan', base: 6.8, label: 'Fiat Cronos' },
  { match: 'etios', categoria: 'auto_chico', base: 6.2, label: 'Toyota Etios' },
  { match: 'voyage', categoria: 'sedan', base: 6.8, label: 'VW Voyage' },
  { match: 'logan', categoria: 'sedan', base: 6.8, label: 'Renault Logan' },
  { match: 'ka', categoria: 'auto_chico', base: 6.3, label: 'Ford Ka' },
  // --- Camiones livianos cabina ---
  { match: 'accelo', categoria: 'camion_liviano', base: 18.0, label: 'Mercedes-Benz Accelo' },
  { match: 'tector', categoria: 'camion_liviano', base: 22.0, label: 'Iveco Tector' },
  { match: 'worker', categoria: 'camion_liviano', base: 22.0, label: 'VW Worker' }
]

export function consumoCategoria(categoriaId) {
  const c = CATEGORIAS.find((x) => x.id === categoriaId)
  return c ? c.consumoTipico : 9.0
}

// Ajuste leve por antigüedad: autos más viejos consumen un poco más.
function ajustePorAnio(base, anio) {
  if (!anio) return base
  const actual = new Date().getFullYear()
  const edad = Math.max(0, actual - Number(anio))
  // +1.5% por año de antigüedad, tope +20%.
  const factor = 1 + Math.min(0.2, edad * 0.015)
  return base * factor
}

// Estima L/100km a partir de categoría + modelo (texto libre) + año.
// Devuelve { consumoL100, fuente } donde fuente describe de dónde salió.
export function estimarConsumo(categoriaId, modeloTexto, anio) {
  const txt = (modeloTexto || '').toLowerCase().trim()
  if (txt) {
    const encontrado = MODELOS.find((m) => txt.includes(m.match))
    if (encontrado) {
      return {
        consumoL100: Number(ajustePorAnio(encontrado.base, anio).toFixed(1)),
        fuente: `Estimado por modelo (${encontrado.label})`
      }
    }
  }
  const base = consumoCategoria(categoriaId)
  return {
    consumoL100: Number(ajustePorAnio(base, anio).toFixed(1)),
    fuente: 'Estimado por categoría (modelo no encontrado)'
  }
}

// Lista de modelos incluidos (para el README / ampliación futura).
export function listaModelos() {
  return MODELOS.map((m) => m.label)
}
