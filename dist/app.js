"use strict";

(() => {
  const root = document.documentElement;
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");
  const storageKey = "touchvalidator-theme";
  let preference = "system";
  try { preference = localStorage.getItem(storageKey) || "system"; } catch {}

  function applyTheme(value, persist = false) {
    preference = ["light", "dark", "system"].includes(value) ? value : "system";
    const theme = preference === "dark" || preference === "system" && systemTheme.matches ? "dark" : "light";
    root.dataset.theme = theme;
    root.dataset.themePreference = preference;
    const trigger = document.getElementById("theme-trigger");
    if (trigger) {
      const label = {light: "Claro", dark: "Oscuro", system: "Automático"}[preference];
      trigger.setAttribute("aria-label", `Cambiar apariencia: ${label}`);
      trigger.title = preference === "system" ? "Automático: sigue el tema del dispositivo" : preference === "dark" ? "Modo oscuro" : "Modo claro";
      document.getElementById("theme-label").textContent = label;
      document.getElementById("theme-symbol").setAttribute("href", `#icon-${preference}`);
      document.querySelectorAll("[data-theme-choice]").forEach(option => {
        option.setAttribute("aria-checked", String(option.dataset.themeChoice === preference));
      });
    }
    document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#0d1015" : "#f5f6f8";
    if (persist) { try { localStorage.setItem(storageKey, preference); } catch {} }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const picker = document.querySelector(".theme-picker");
    const trigger = document.getElementById("theme-trigger");
    const menu = document.getElementById("theme-menu");
    const options = [...picker.querySelectorAll("[data-theme-choice]")];
    function closeThemeMenu(returnFocus = false) {
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      if (returnFocus) trigger.focus();
    }
    function openThemeMenu() {
      const mobileToggle = document.querySelector(".menu-toggle");
      if (mobileToggle.getAttribute("aria-expanded") === "true") mobileToggle.click();
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      options.find(option => option.dataset.themeChoice === preference).focus();
    }
    trigger.addEventListener("click", () => menu.hidden ? openThemeMenu() : closeThemeMenu());
    trigger.addEventListener("keydown", event => {
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        openThemeMenu();
      }
    });
    options.forEach(option => option.addEventListener("click", () => {
      applyTheme(option.dataset.themeChoice, true);
      closeThemeMenu(true);
    }));
    picker.addEventListener("keydown", event => {
      if (menu.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeThemeMenu(true);
      } else if (event.key === "Tab") {
        closeThemeMenu(true);
      } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const index = options.indexOf(document.activeElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
        options[next].focus();
      }
    });
    document.addEventListener("pointerdown", event => {
      if (!picker.contains(event.target)) closeThemeMenu();
    });
    picker.addEventListener("focusout", event => {
      if (!picker.contains(event.relatedTarget)) closeThemeMenu();
    });
    applyTheme(preference);
  }, {once: true});
  systemTheme.addEventListener("change", () => { if (preference === "system") applyTheme("system"); });
  window.addEventListener("storage", event => { if (event.key === storageKey || event.key === null) applyTheme(event.newValue); });
  applyTheme(preference);
})();

document.addEventListener("DOMContentLoaded", () => {
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
      document.getElementById("screen-counter").textContent = `0${Object.keys(screens).indexOf(button.dataset.screen) + 1} / 03`;
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

  document.querySelectorAll("[data-download-platform]").forEach(link => {
    link.addEventListener("click", () => selectPlatform(link.dataset.downloadPlatform));
  });

  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  function closeMenu() {
    mobileNav.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir navegación");
    updateDock();
  }
  menuToggle.addEventListener("click", () => {
    const opened = menuToggle.getAttribute("aria-expanded") !== "true";
    mobileNav.hidden = !opened;
    menuToggle.setAttribute("aria-expanded", String(opened));
    menuToggle.setAttribute("aria-label", opened ? "Cerrar navegación" : "Abrir navegación");
    updateDock();
  });
  mobileNav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", event => {if (event.key === "Escape" && !mobileNav.hidden) {closeMenu(); menuToggle.focus();}});
  document.addEventListener("pointerdown", event => {
    if (!mobileNav.hidden && !event.target.closest(".header")) closeMenu();
  });
  matchMedia("(min-width: 1001px)").addEventListener("change", event => { if (event.matches) closeMenu(); });

  const dock = document.getElementById("mobile-dock");
  const dockSections = new Map([["inicio", true], ["descargar", false]]);
  function updateDock() {
    dock.hidden = !mobileNav.hidden || [...dockSections.values()].some(Boolean);
  }
  if ("IntersectionObserver" in window) {
    const dockObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => dockSections.set(entry.target.id, entry.isIntersecting));
      updateDock();
    });
    dockSections.forEach((visible, id) => dockObserver.observe(document.getElementById(id)));
  }

  const faqSearch = document.getElementById("faq-search");
  const faqItems = [...document.querySelectorAll(".faq-list details")];
  const faqStatus = document.getElementById("faq-search-status");
  const faqEmpty = document.getElementById("faq-empty");
  const normalize = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const faqText = faqItems.map(item => normalize(item.textContent));
  let savedFaqState = null;
  function filterQuestions() {
    const query = normalize(faqSearch.value.trim());
    if (query && !savedFaqState) savedFaqState = faqItems.map(item => item.open);
    const words = query.split(/\s+/).filter(Boolean);
    let count = 0;
    faqItems.forEach((item, index) => {
      const matches = words.every(word => faqText[index].includes(word));
      item.hidden = !matches;
      if (matches) count++;
      if (query) item.open = matches;
      else if (savedFaqState) item.open = savedFaqState[index];
    });
    faqEmpty.hidden = count !== 0;
    faqStatus.textContent = query ? `${count} ${count === 1 ? "pregunta encontrada" : "preguntas encontradas"}` : "";
    if (!query) savedFaqState = null;
  }
  faqSearch.addEventListener("input", filterQuestions);
  faqSearch.addEventListener("keydown", event => {
    if (event.key === "Escape") { faqSearch.value = ""; filterQuestions(); }
  });
  document.getElementById("faq-clear").addEventListener("click", () => {
    faqSearch.value = "";
    filterQuestions();
    faqSearch.focus();
  });
  document.getElementById("year").textContent = String(new Date().getFullYear());
}, {once: true});
