# Checklist para dejar la app al 100%

Marcá cada paso. Los comandos van en una terminal **PowerShell** dentro de la carpeta del proyecto.

> Nota: en esta PC `node`/`npm`/`git` no están en el PATH por defecto. Si algún comando
> "no se reconoce", ejecutá primero:
> ```powershell
> $env:Path = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;" + $env:Path
> ```

---

## 1. Subir el código a GitHub

1. Entrá a https://github.com/new y creá un repo **público** llamado exactamente **`logistica`**
   (sin README, sin .gitignore, vacío). El nombre debe ser `logistica` porque la app está
   configurada para la URL `https://juanmaise06.github.io/logistica/`.
2. En la terminal:
   ```powershell
   git remote add origin https://github.com/juanmaise06/logistica.git
   git push -u origin main
   ```
   (Si te pide login, usá tu usuario de GitHub. El commit inicial ya está hecho.)

## 2. Activar GitHub Pages con Actions

1. En el repo → **Settings → Pages**.
2. En **Build and deployment → Source**, elegí **GitHub Actions**.
3. Listo: con cada `git push` a `main`, el workflow `.github/workflows/deploy.yml`
   compila y publica solo. Podés ver el progreso en la pestaña **Actions**.
4. Cuando termine (1–2 min), la app queda en **https://juanmaise06.github.io/logistica/**.

## 3. Configurar Firebase (una sola vez)

1. https://console.firebase.google.com → proyecto **logistica-app-c0397**.
2. **Authentication → Sign-in method**: habilitá **Correo electrónico/contraseña**.
3. **Authentication → Settings → Dominios autorizados**: agregá `juanmaise06.github.io`.
4. **Firestore Database**: si no existe, "Crear base de datos" (modo producción, región sugerida `southamerica-east1`).
5. **Firestore → Reglas**: borrá lo que haya y pegá TODO el contenido del archivo
   [`firestore.rules`](./firestore.rules). Tocá **Publicar**.

## 4. Restringir la API key de TomTom

1. https://developer.tomtom.com → tu Dashboard → la API key.
2. Activá la restricción por **HTTP Referer** y agregá: `https://juanmaise06.github.io/*`
3. Asegurate de que estén habilitadas: **Search, Routing, Waypoint Optimization,
   Traffic (Flow + Incidents) y Maps (Raster/Vector)**.

## 5. Probar (criterios de aceptación)

Abrí la app y verificá:
- [ ] Registro → llega el mail de verificación → **no entra hasta verificar**.
- [ ] Crear equipo → copiar código → otra cuenta se une con ese código.
- [ ] Crear vehículo: modelo+año sugiere consumo, lo editás y guarda.
- [ ] Crear combustibles con precio y asignarlos al vehículo.
- [ ] Guardar lugares y reusarlos en un recorrido.
- [ ] Armar 2 escenarios (A vs B), ida/vuelta, optimizar orden, ver mapa con tráfico y cortes.
- [ ] Ver tiempo/km/litros/$ por separado + recomendación en una frase.
- [ ] Registrar el viaje hecho → aparece en Historial.
- [ ] Dashboard con totales del día y de un rango.
- [ ] Exportar el mes a Excel (abre en PC y celular).
- [ ] Como admin ves viajes del equipo; como miembro, solo los tuyos.
- [ ] Instalar como app (celular: "Agregar a inicio"; PC: ícono de instalar en Chrome/Edge).

## 6. Mantenimiento

- Para cambios futuros: editás el código, `git add -A`, `git commit -m "..."`, `git push`.
  El deploy se hace solo.
- Compilar localmente para probar: `npm run build` y `npm run preview`.
- Para ampliar la tabla de consumo de vehículos: editá `src/services/consumoVehiculos.js`.
