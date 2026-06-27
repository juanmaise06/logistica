# Logística — Evaluador de eficiencia de viajes (PWA)

App instalable (PWA) para que un transportista decida **a qué proveedor/localidad le conviene ir a buscar mercadería**, comparando escenarios por **tiempo estimado, combustible ($ y litros) y distancia**. Incluye registro de viajes, historial mensual, dashboard de consumo y export a Excel. Equipos con admin/miembro.

Stack: **React + Vite**, **Firebase** (Auth + Firestore), **OpenStreetMap** (Nominatim para búsqueda, OSRM para ruteo/optimización, Leaflet + CARTO para el mapa — sin API key ni tarjeta), **SheetJS** (xlsx), service worker vía `vite-plugin-pwa`. Pensada para desplegar en **GitHub Pages** (estático, sin backend).

> Nota: al usar OpenStreetMap el tiempo de viaje es **estimado** (sin tráfico en vivo) y no hay datos de cortes/incidentes. La búsqueda de direcciones, las rutas, la distancia, el combustible y la optimización de paradas funcionan completos.

---

## 1. Dónde van las claves

La config de cliente está en **`src/config.js`**:

- `firebaseConfig` — la config web de tu proyecto Firebase (pública por diseño).
- Los mapas (OpenStreetMap) **no requieren clave**.

> **Importante (seguridad real):**
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

## 5. Uso de OpenStreetMap (buenas prácticas)

- Búsqueda (Nominatim) con **debounce** (~650 ms, no se llama en cada tecla) para respetar el límite de ~1 req/seg; solo se guardan las coordenadas de los lugares que elegís.
- Las rutas se calculan **al tocar "Calcular y comparar"**, no en cada cambio.
- Optimización de orden (OSRM): límite de **12 puntos**. Si te pasás, la app avisa.
- Tiles de mapa (CARTO) cacheados por el service worker.
- El ruteo usa el servidor de demostración público de OSRM (`router.project-osrm.org`), pensado para uso liviano. Para volumen alto conviene un OSRM propio u OpenRouteService (clave gratuita, sin tarjeta).

---

## 6. PWA / instalación

- **Android/iOS:** abrir la URL en Chrome/Safari → "Agregar a pantalla de inicio".
- **PC (Chrome/Edge):** ícono de instalar en la barra de direcciones.
- El shell se cachea para abrir rápido y offline; la **búsqueda de direcciones y el mapa requieren conexión** (la app lo avisa).

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
  config.js              config (Firebase) y constantes de mapa
  firebase.js            init de Firebase
  contexts/AuthContext   auth, verificación, perfil, equipo
  hooks/useColeccion     carga de colecciones del usuario
  services/
    mapas.js             búsqueda (Nominatim), ruteo y optimización (OSRM)
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
