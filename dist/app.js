"use strict";

const screens = {
  home: {file: "assets/home.png", alt: "Pantalla principal real de TouchValidator Android con verificación de root y selección de aplicaciones", caption: "Captura real de la app · Android 0.1.10"},
  library: {file: "assets/library.png", alt: "Biblioteca real de TouchValidator con grabaciones guardadas y sus contadores", caption: "Biblioteca de grabaciones · Captura real de Android"},
  playback: {file: "assets/playback.png", alt: "Controles reales de reproducción con velocidad, ciclos y cuenta regresiva", caption: "Ajustes de reproducción · Captura real de Android"}
};

document.querySelectorAll("[data-screen]").forEach(button => {
  button.addEventListener("click", () => {
    const screen = screens[button.dataset.screen];
    const image = document.getElementById("app-screen");
    image.src = screen.file;
    image.alt = screen.alt;
    document.getElementById("screen-caption").textContent = screen.caption;
    document.querySelectorAll("[data-screen]").forEach(item => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
  });
});

const platforms = {
  android: {
    name: "TouchValidator para Android", version: "Versión 0.1.10 · APK · 509 KB",
    filename: "TouchValidator-Android-0.1.10.apk", button: "Descargar APK",
    requirements: ["Android 9 o posterior", "Acceso root autorizado con Magisk / su", "Permiso para mostrar sobre otras apps"],
    note: "Compilación de desarrollo para pruebas. La versión actual permite depuración; no es una versión de producción.",
    steps: ["Abre el APK descargado. Si Android lo solicita, autoriza la instalación desde tu navegador.", "Abre TouchValidator y pulsa «Comprobar root y sensor». Autoriza el acceso en Magisk.", "Permite mostrar sobre otras apps y habilita las notificaciones para acceder a «Detener».", "Prueba primero en «Pantalla de prueba de gestos», guarda una secuencia y autoriza un ciclo."]
  },
  ios: {
    name: "TouchValidator para iOS", version: "Versión 0.10.1 · DEB · 1.41 MB",
    filename: "TouchValidator-iOS-0.10.1.deb", button: "Descargar DEB",
    requirements: ["iPhone con jailbreak rootless compatible con Dopamine", "Sileo o Filza para instalar el paquete DEB", "Dispositivo de pruebas y compatibilidad verificada"],
    note: "Versión experimental con un problema conocido de autenticación del servicio local. Úsala únicamente en un dispositivo de pruebas hasta corregirlo.",
    steps: ["Descarga el DEB en tu iPhone y ábrelo con Sileo o Filza para instalarlo.", "Abre TouchValidator. Toca la pantalla una vez para que el servicio reconozca el sensor.", "Pulsa «Comprobar servicio» y verifica que el sensor esté listo. Si el servicio no aparece, reinicia el entorno del jailbreak.", "Mantén TouchValidator visible, habilita una prueba y comprueba el toque central antes de usar secuencias."]
  }
};

function selectPlatform(platform, moveFocus = false) {
  const data = platforms[platform];
  if (!data) return;
  document.querySelectorAll("[data-platform]").forEach(button => {
    const selected = button.dataset.platform === platform;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && moveFocus) button.focus();
  });
  document.getElementById("platform-panel").setAttribute("aria-labelledby", `tab-${platform}`);
  document.getElementById("download-name").textContent = data.name;
  document.getElementById("download-version").textContent = data.version;
  const list = document.getElementById("requirement-list");
  list.replaceChildren(...data.requirements.map(text => {
    const li = document.createElement("li");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#icon-check");
    icon.append(use);
    li.append(icon, document.createTextNode(text));
    return li;
  }));
  const download = document.getElementById("download-file");
  download.href = `downloads/${data.filename}`;
  download.download = data.filename;
  download.firstChild.textContent = `${data.button} `;
  const note = document.getElementById("release-note");
  note.textContent = data.note;
  note.classList.toggle("experimental", platform === "ios");
  document.getElementById("installation-steps").replaceChildren(...data.steps.map(text => {
    const li = document.createElement("li");
    li.textContent = text;
    return li;
  }));
}

document.querySelectorAll("[data-platform]").forEach(button => {
  button.addEventListener("click", () => selectPlatform(button.dataset.platform));
  button.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? "android" : event.key === "End" ? "ios" : button.dataset.platform === "android" ? "ios" : "android";
    selectPlatform(next, true);
  });
});

const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.getElementById("mobile-nav");
function closeMenu() {mobileNav.hidden = true; menuToggle.setAttribute("aria-expanded", "false"); menuToggle.setAttribute("aria-label", "Abrir navegación");}
menuToggle.addEventListener("click", () => {
  const opened = menuToggle.getAttribute("aria-expanded") !== "true";
  mobileNav.hidden = !opened;
  menuToggle.setAttribute("aria-expanded", String(opened));
  menuToggle.setAttribute("aria-label", opened ? "Cerrar navegación" : "Abrir navegación");
});
mobileNav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", event => {if (event.key === "Escape" && !mobileNav.hidden) {closeMenu(); menuToggle.focus();}});
document.getElementById("year").textContent = String(new Date().getFullYear());
