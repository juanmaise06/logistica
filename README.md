# Logística — Evaluador de eficiencia de viajes (PWA)

App instalable (PWA) para que un transportista decida **a qué proveedor/localidad le conviene ir a buscar mercadería**, comparando escenarios por **tiempo con tráfico, combustible ($ y litros), distancia y cortes/incidentes**. Incluye registro de viajes, historial mensual, dashboard de consumo y export a Excel. Equipos con admin/miembro.

Stack: **React + Vite**, **Firebase** (Auth + Firestore), **TomTom Maps APIs**, **SheetJS** (xlsx), service worker vía `vite-plugin-pwa`. Pensada para desplegar en **GitHub Pages** (estático, sin backend).

---

## 1. Dónde van las claves

Todas las claves de cliente están en **`src/config.js`** (son públicas por diseño; se protegen por restricción de dominio + reglas de Firestore):

- `TOMTOM_API_KEY` — tu API key de TomTom.
- `firebaseConfig` — la config web de tu proyecto Firebase.

> **Importante (seguridad real):**
> - En el panel de **TomTom**, restringí la key al dominio `https://juanmaise06.github.io` (HTTP Referer).
> - En **Firebase Console → Authentication → Settings → Dominios autorizados**, agregá `juanmaise06.github.io`.
> - En **Firestore → Reglas**, pegá el contenido de [`firestore.rules`](./firestore.rules) y publicá. Eso impide que un usuario lea datos de otro del lado del servidor.

El `base` de Vite (en `vite.config.js`) está en `/logistica/` para que coincida con la URL final `https://juanmaise06.github.io/logistica/`. Si cambiás el nombre del repo, actualizá ese `base`, el `start_url` y el `scope` del manifest.

---

## 2. Requisitos de Firebase (una sola vez)

1. **Authentication** → habilitar **Email/Password**.
2. La verificación por correo ya se dispara sola al registrarse (la app bloquea el acceso hasta verificar).
3. **Firestore Database** → crear en modo producción y pegar las reglas de `firestore.rules`.
4. Índices: las consultas se filtran por `userId`/`teamId` con igualdad simple y se ordenan en el cliente, así que **no hacen falta índices compuestos**. Si Firestore te sugiere alguno, seguí el enlace que te da la consola.

---

## 3. Compilar

```bash
npm install
node scripts/generar-iconos.mjs   # genera los íconos PNG de la PWA (ya incluidos)
npm run build                     # genera la carpeta dist/
npm run preview                   # opcional: previsualizar el build local
```

Para desarrollo local: `npm run dev`.

---

## 4. Desplegar en GitHub Pages

Opción simple (subiendo `dist/`):

1. Creá el repo `logistica` en GitHub.
2. Subí **el contenido de `dist/`** a la rama que use Pages (ej. `gh-pages`) o configurá Pages para servir desde `/docs` y copiá `dist/` ahí.
3. En **Settings → Pages**, elegí la rama/carpeta. La URL queda `https://<usuario>.github.io/logistica/`.

> Como la app usa **HashRouter**, las rutas (`/#/historial`, etc.) funcionan en Pages sin configuración extra de redirecciones.

Opción con GitHub Actions: agregá un workflow que corra `npm ci && npm run build` y publique `dist/` con `actions/deploy-pages`.

---

## 5. Uso de TomTom y free tier

- Geocoding con **debounce** (no se llama en cada tecla) y solo se guardan las coordenadas de los lugares que elegís.
- Las rutas/incidentes se calculan **al tocar "Calcular y comparar"**, no en cada cambio.
- Optimización de orden: límite **12 waypoints** (origen + destinos + vuelta). Si te pasás, la app avisa.
- Tiles de mapa cacheados por el service worker.

---

## 6. PWA / instalación

- **Android/iOS:** abrir la URL en Chrome/Safari → "Agregar a pantalla de inicio".
- **PC (Chrome/Edge):** ícono de instalar en la barra de direcciones.
- El shell se cachea para abrir rápido y offline; el **tráfico en vivo requiere conexión** (la app lo avisa).

---

## 7. Modelos incluidos en la tabla de consumo

La tabla está en [`src/services/consumoVehiculos.js`](./src/services/consumoVehiculos.js) y es fácil de ampliar (agregá entradas a `MODELOS`). Incluidos:

**Utilitarios:** Fiat Fiorino, Renault Kangoo, Peugeot Partner, Citroën Berlingo, Fiat Doblò, VW Caddy.
**Furgones grandes:** Renault Master, Mercedes-Benz Sprinter, Ford Transit, Fiat Ducato, Peugeot Boxer, Citroën Jumper, VW Crafter, Iveco Daily.
**Pick-ups:** Toyota Hilux, VW Amarok, Ford Ranger, Nissan Frontier, Chevrolet S10, Fiat Toro, VW Saveiro, Fiat Strada, Renault Oroch.
**Autos/sedanes:** VW Gol, Chevrolet Onix, Chevrolet Corsa, Renault Clio, Renault Sandero, Fiat Palio, Toyota Corolla, Fiat Cronos, Toyota Etios, VW Voyage, Renault Logan, Ford Ka.
**Camiones livianos:** Mercedes-Benz Accelo, Iveco Tector, VW Worker.

Si el modelo tipeado no coincide, se usa el **consumo típico de la categoría** como fallback. El valor siempre es **editable** y se guarda el que vos pongas.

---

## 8. Estructura

```
src/
  config.js              claves (TomTom + Firebase)
  firebase.js            init de Firebase
  contexts/AuthContext   auth, verificación, perfil, equipo
  hooks/useColeccion     carga de colecciones del usuario
  services/
    tomtom.js            geocoding, ruteo c/tráfico, optimización, incidentes
    calculo.js           costos por escenario + recomendación
    consumoVehiculos.js  tabla interna de consumo (ampliable)
    firestore.js         CRUD + equipos + viajes
    excel.js             export .xlsx (SheetJS)
    formato.js           formatos ARS/km/fecha
  components/            UI (mapa, autocomplete, layout, íconos…)
  pages/                 Auth, Comparar, Historial, Dashboard, Vehículos,
                         Combustibles, Lugares, Perfil, VerificarEmail
firestore.rules          reglas de seguridad (pegar en Firestore)
public/                  favicon, íconos PWA
```
