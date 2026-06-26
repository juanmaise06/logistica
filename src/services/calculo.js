// =============================================================================
//  Motor de cálculo de costos y recomendación entre escenarios.
//  Mantiene SIEMPRE los componentes desglosados (tiempo, km, litros, $ comb,
//  $ tiempo) y además calcula un costo total para poder recomendar.
// =============================================================================

// Calcula los números de un escenario a partir de la ruta (ya obtenida de TomTom)
// y los parámetros del vehículo/combustible.
//
// ruta: { distanciaKm, tiempoMin, demoraTraficoMin }
// idaYVuelta: bool -> duplica distancia y tiempo del tramo (aprox simétrico)
// consumoL100, precioLitro, valorHora (ARS)
export function calcularEscenario(ruta, { idaYVuelta, consumoL100, precioLitro, valorHora }) {
  const factor = idaYVuelta ? 2 : 1
  const distanciaKm = ruta.distanciaKm * factor
  const tiempoMin = ruta.tiempoMin * factor
  const demoraTraficoMin = (ruta.demoraTraficoMin || 0) * factor

  const litros = distanciaKm * (Number(consumoL100) / 100)
  const costoCombustible = litros * Number(precioLitro || 0)
  const costoTiempo = (tiempoMin / 60) * Number(valorHora || 0)
  const costoTotal = costoCombustible + costoTiempo

  return {
    distanciaKm,
    tiempoMin,
    demoraTraficoMin,
    litros,
    costoCombustible,
    costoTiempo,
    costoTotal
  }
}

// Recibe escenarios [{ nombre, calc, incidentes:[] }] y devuelve:
// { ganadorIdx, frase, detalle }
export function recomendar(escenarios) {
  if (!escenarios || escenarios.length === 0) return null
  const validos = escenarios.filter((e) => e.calc)
  if (validos.length === 0) return null

  // El ganador es el de menor costo total. Si valorHora = 0, el costo total
  // es solo combustible, así que igual prioriza el más barato; en empate de
  // combustible desempata por tiempo.
  let ganador = validos[0]
  validos.forEach((e) => {
    if (
      e.calc.costoTotal < ganador.calc.costoTotal - 0.01 ||
      (Math.abs(e.calc.costoTotal - ganador.calc.costoTotal) < 0.01 &&
        e.calc.tiempoMin < ganador.calc.tiempoMin)
    ) {
      ganador = e
    }
  })

  if (validos.length === 1) {
    return {
      ganadorNombre: ganador.nombre,
      frase: `Único escenario calculado: ${ganador.nombre}.`,
      ganadorRef: ganador
    }
  }

  // Comparar contra el segundo mejor para armar la frase.
  const otros = validos.filter((e) => e !== ganador)
  let segundo = otros[0]
  otros.forEach((e) => {
    if (e.calc.costoTotal < segundo.calc.costoTotal) segundo = e
  })

  const difMin = Math.round(segundo.calc.tiempoMin - ganador.calc.tiempoMin)
  const difComb = Math.round(segundo.calc.costoCombustible - ganador.calc.costoCombustible)

  const partes = []
  if (difMin > 0) partes.push(`llegás ${difMin} min antes`)
  else if (difMin < 0) partes.push(`tardás ${Math.abs(difMin)} min más pero conviene igual por costo`)
  if (difComb > 0) partes.push(`gastás $${formatNum(difComb)} menos de combustible`)
  else if (difComb < 0) partes.push(`gastás $${formatNum(Math.abs(difComb))} más de combustible`)

  let frase = `Conviene ${ganador.nombre}`
  if (partes.length) frase += `: ${partes.join(' y ')}.`
  else frase += `.`

  // Avisos por incidentes en la ruta ganadora.
  const incGanador = ganador.incidentes || []
  if (incGanador.length) {
    const retrasoTotal = incGanador.reduce((a, i) => a + (i.retrasoMin || 0), 0)
    const peor = incGanador.slice().sort((a, b) => (b.retrasoMin || 0) - (a.retrasoMin || 0))[0]
    if (retrasoTotal > 0) {
      frase += ` Ojo: ${peor.tipo.toLowerCase()} en la ruta (~${retrasoTotal} min de demora).`
    } else {
      frase += ` Ojo: hay ${incGanador.length} incidente(s) reportado(s) en la zona.`
    }
  }

  return { ganadorNombre: ganador.nombre, frase, ganadorRef: ganador }
}

function formatNum(n) {
  return new Intl.NumberFormat('es-AR').format(Math.round(n))
}
