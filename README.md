# TouchValidator · JABASYS

Sitio de presentación de TouchValidator, con capturas reales de la app, demostración animada, requisitos y descargas de prueba para Android e iOS.

**Web:** https://camiloxx.github.io/touchvalidator-web/

**Repositorio:** https://github.com/CamiloxX/touchvalidator-web

Diseño adaptable a móvil y escritorio, con una paleta de negro, gris y plata basada en el logo de JABASYS. HTML, CSS y JavaScript sin dependencias ni compilación; tipografía Manrope y recursos alojados en la propia web. La licencia de la tipografía está en `dist/assets/fonts/OFL.txt`.

El selector «Apariencia» de la cabecera ofrece los modos claro, oscuro y automático. La elección se guarda en el navegador, se sincroniza entre pestañas de esta web y se aplica antes de mostrar la página. En automático, la apariencia sigue los cambios del tema del dispositivo.

## Vista local

Desde la carpeta del proyecto:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Abre `http://127.0.0.1:4173/`.

## Publicación en GitHub Pages

El flujo `.github/workflows/pages.yml` comprueba los archivos permitidos y las sumas SHA-256, y publica únicamente `dist/` al actualizar la rama `main`.

1. Crea un repositorio para esta web y sube este proyecto a la rama `main`.
2. En **Settings → Pages → Build and deployment → Source**, elige **GitHub Actions**.
3. En **Actions → Publish TouchValidator**, ejecuta **Run workflow**, o sube un nuevo cambio a `main`.
4. La dirección definitiva aparecerá en el despliegue y en **Settings → Pages**.

Los enlaces a recursos y descargas son relativos, de modo que también funcionan si Pages aloja la web en una subcarpeta. `_headers` conserva la configuración del alojamiento anterior; GitHub Pages no aplica ese archivo.

## Verificación

Antes de cualquier publicación:

```powershell
node scripts/verify-release.mjs
node --check dist/app.js
node --check dist/intro.js
```

La demostración dura 26 segundos: una mano ilustrada realiza toques con ondas de contacto y un deslizamiento con rastro luminoso. El panel flotante muestra el inicio de grabación, el guardado y la reproducción, incluida una pausa con Volumen abajo y la continuación de la sesión. Tiene controles de pausa, reinicio y avance por teclado. Se detiene cuando deja de estar visible y respeta la preferencia de reducir movimiento. La galería, el menú móvil, las pestañas Android/iOS y los acordeones permiten navegar con teclado.

## Descargas

- Android 0.1.10: APK de desarrollo; requiere Android 9 o posterior y root.
- iOS 0.10.1: DEB experimental; requiere jailbreak rootless compatible. Esta versión tiene un problema conocido de autenticación del servicio local, indicado en la web.

Para cambiar una descarga, sustituye su instalador en `dist/downloads/`, actualiza `dist/index.html`, `dist/app.js` y los archivos permitidos de `scripts/verify-release.mjs`, y regenera `dist/downloads/SHA256SUMS.txt`.

## Propiedad del proyecto

TouchValidator es una app propietaria de JABASYS. Este repositorio contiene la web de presentación, sus capturas, instaladores y sumas de comprobación. **No incluye el código fuente de las apps Android o iOS**. No publiques sus proyectos, archivos de código fuente, credenciales ni registros de dispositivos.

© JABASYS. Todos los derechos reservados.
