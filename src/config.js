// =============================================================================
//  Claves de cliente (públicas por diseño).
//  Se protegen con RESTRICCIÓN POR DOMINIO (en el panel de TomTom y Firebase)
//  + reglas de seguridad de Firestore. No se "ocultan".
// =============================================================================

// --- TomTom ---
// Restringir esta key al dominio: https://juanmaise06.github.io/logistica/
export const TOMTOM_API_KEY = 'vZ2skFD58JD5vokAsnmb0Qlk0aV57J5U'

// --- Firebase (config web del proyecto) ---
export const firebaseConfig = {
  apiKey: 'AIzaSyDh_VVz85FKvWBu_2yUkBJbmCYWGMt7XXw',
  authDomain: 'logistica-app-c0397.firebaseapp.com',
  projectId: 'logistica-app-c0397',
  storageBucket: 'logistica-app-c0397.firebasestorage.app',
  messagingSenderId: '577869354144',
  appId: '1:577869354144:web:25fc796b261bea126d65c5',
  measurementId: 'G-S34QPD0DDY'
}

// País por defecto para geocoding/búsqueda (Argentina).
export const PAIS_DEFAULT = 'AR'

// Centro inicial del mapa (Buenos Aires) si no hay origen elegido.
export const CENTRO_DEFAULT = { lng: -58.3816, lat: -34.6037 }

// Valor por defecto del tiempo del transportista ($/hora). Editable en Perfil.
export const VALOR_HORA_DEFAULT = 0
