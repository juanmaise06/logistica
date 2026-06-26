// Genera los íconos PNG de la PWA sin dependencias externas.
// Dibuja: fondo de marca + un "route" (dos nodos unidos por una línea) en celeste.
// Uso: node scripts/generar-iconos.mjs
import zlib from 'node:zlib'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(OUT, { recursive: true })

// --- CRC32 ---
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function hex(c) {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
}

// Dibuja un ícono de tamaño `size`. `pad` = margen (para maskable).
function render(size, { bg, fg, accent, pad = 0 }) {
  const px = new Uint8Array(size * size * 4)
  const [br, bgc, bb] = hex(bg)
  const [fr, fgc, fb] = hex(fg)
  const [ar, ag, ab] = hex(accent)

  const set = (x, y, r, g, b) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255
  }
  // Fondo redondeado.
  const radius = size * 0.22
  const inset = pad
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // máscara de esquinas redondeadas
      const dx = Math.max(inset + radius - x, x - (size - inset - radius), 0)
      const dy = Math.max(inset + radius - y, y - (size - inset - radius), 0)
      const dentro = x >= inset && x < size - inset && y >= inset && y < size - inset &&
        Math.hypot(dx, dy) <= radius
      if (dentro) set(x, y, br, bgc, bb)
    }
  }

  // "Route": nodo abajo-izq, nodo arriba-der, línea curva simple (gruesa).
  const cx1 = size * 0.30, cy1 = size * 0.70
  const cx2 = size * 0.70, cy2 = size * 0.30
  const grosor = size * 0.07
  const disco = (cx, cy, rad, r, g, b) => {
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++)
      for (let x = Math.floor(cx - rad); x <= cx + rad; x++)
        if (Math.hypot(x - cx, y - cy) <= rad) set(x, y, r, g, b)
  }
  // línea: interpolación entre los dos nodos con leve curva (vía punto de control)
  const ctrlX = size * 0.30, ctrlY = size * 0.30
  for (let t = 0; t <= 1; t += 0.002) {
    const mt = 1 - t
    const x = mt * mt * cx1 + 2 * mt * t * ctrlX + t * t * cx2
    const y = mt * mt * cy1 + 2 * mt * t * ctrlY + t * t * cy2
    disco(x, y, grosor / 2, ar, ag, ab)
  }
  disco(cx1, cy1, size * 0.11, fr, fgc, fb)
  disco(cx2, cy2, size * 0.11, ar, ag, ab)
  disco(cx1, cy1, size * 0.05, br, bgc, bb)
  disco(cx2, cy2, size * 0.05, br, bgc, bb)

  // Codificar a PNG (filtro 0 por scanline).
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0
    Buffer.from(px.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

const tema = { bg: '#0f172a', fg: '#38bdf8', accent: '#34d399' }

fs.writeFileSync(path.join(OUT, 'icon-192.png'), render(192, tema))
fs.writeFileSync(path.join(OUT, 'icon-512.png'), render(512, tema))
fs.writeFileSync(path.join(OUT, 'icon-maskable-512.png'), render(512, { ...tema, pad: 52 }))
console.log('Íconos generados en public/icons/')
