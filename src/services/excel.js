// Export del historial a .xlsx con SheetJS, del lado del cliente (sin backend).
import * as XLSX from 'xlsx'
import { fechaCorta } from './formato'

export function exportarViajesExcel(viajes, nombreArchivo = 'historial-viajes.xlsx', nombrePorUid = {}) {
  const filas = viajes.map((v) => ({
    Fecha: fechaCorta(v.fecha?.seconds ? v.fecha.seconds * 1000 : v.fecha),
    Usuario: nombrePorUid[v.userId] || '',
    Vehículo: v.vehiculoNombre || '',
    Origen: v.origen?.nombre || '',
    Destinos: (v.destinos || []).map((d) => d.nombre).join(' → '),
    'Ida y vuelta': v.idaYVuelta ? 'Sí' : 'No',
    'Km': redondear(v.distanciaKm, 1),
    'Tiempo (min)': Math.round(v.tiempoMin || 0),
    'Litros': redondear(v.litros, 2),
    '$ Combustible': redondear(v.costoCombustible, 0),
    '$ Tiempo': redondear(v.costoTiempo, 0),
    'Costo total': redondear(v.costoTotal, 0),
    Notas: v.notas || ''
  }))

  const ws = XLSX.utils.json_to_sheet(filas)
  // Anchos de columna legibles.
  ws['!cols'] = [
    { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 30 },
    { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 30 }
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Viajes')
  // writeFile dispara la descarga; funciona en PC y móvil.
  XLSX.writeFile(wb, nombreArchivo)
}

function redondear(n, dec) {
  const f = Math.pow(10, dec)
  return Math.round((Number(n) || 0) * f) / f
}
