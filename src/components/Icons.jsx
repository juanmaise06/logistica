// Íconos SVG inline (stroke currentColor) para no depender de librerías pesadas.
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const IcoTruck = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
)
export const IcoCompare = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 3v18"/><path d="M5 8l-3 3 3 3"/><path d="M19 8l3 3-3 3"/><path d="M2 11h7"/><path d="M15 11h7"/></svg>
)
export const IcoHistory = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
)
export const IcoDash = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
)
export const IcoCar = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13"/><path d="M3 13h18v5h-2v-2H5v2H3z"/><circle cx="7" cy="16" r="1"/><circle cx="17" cy="16" r="1"/></svg>
)
export const IcoFuel = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 22h12V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/><path d="M3 10h12"/><path d="M15 8l3 3v7a2 2 0 0 0 2-2v-6l-3-3"/></svg>
)
export const IcoPin = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
)
export const IcoUser = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
)
export const IcoPlus = (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 5v14M5 12h14"/></svg>)
export const IcoEdit = (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>)
export const IcoTrash = (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>)
export const IcoCheck = (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M20 6L9 17l-5-5"/></svg>)
export const IcoX = (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>)
export const IcoDownload = (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>)
export const IcoWarn = (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>)
export const IcoStar = (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>)
export const IcoOptim = (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 6h16M4 12h10M4 18h7"/><path d="M18 14l3 3-3 3"/></svg>)
export const IcoLogout = (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>)
export const IcoClock = (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>)
export const IcoRoute = (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h7"/></svg>)
