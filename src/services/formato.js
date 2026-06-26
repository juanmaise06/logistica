// Helpers de formato para Argentina (ARS, km, fechas).

export function pesos(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(Number(n) || 0)
}

export function num(n, dec = 1) {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: dec
  }).format(Number(n) || 0)
}

export function km(n) {
  return `${num(n, 1)} km`
}

export function minutos(n) {
  const t = Math.round(Number(n) || 0)
  if (t < 60) return `${t} min`
  const h = Math.floor(t / 60)
  const m = t % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export function litros(n) {
  return `${num(n, 1)} L`
}

export function fechaCorta(d) {
  const date = d instanceof Date ? d : new Date(d)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function fechaInput(d) {
  // yyyy-mm-dd para <input type="date">
  const date = d instanceof Date ? d : new Date(d)
  const off = date.getTimezoneOffset()
  const local = new Date(date.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}

export function generarCodigoEquipo() {
  // Código corto legible (sin caracteres ambiguos).
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c = ''
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)]
  return c
}
