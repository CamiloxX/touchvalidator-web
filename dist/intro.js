"use strict";

(() => {
  const player = document.getElementById("intro-player");
  const canvas = document.getElementById("intro-canvas");
  const ctx = canvas.getContext("2d");
  const toggle = document.getElementById("intro-toggle");
  const restart = document.getElementById("intro-restart");
  const progress = document.getElementById("intro-progress");
  const clock = document.getElementById("intro-time");
  const caption = document.getElementById("intro-caption");
  const steps = [...document.querySelectorAll("[data-intro-step]")];
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const logo = new Image();
  const duration = 26;
  const ink = "#f6f7fa";
  const silver = "#d2d9e4";
  const panelSilver = "#d8dfe9";
  const recordAccent = "#b8c2cf";
  const muted = "#a0a8b4";
  let width = 1280, height = 720, portrait = false;
  let position = 0, frameId = 0, lastTime = 0;
  let playing = false, wanted = false, visible = false, started = false;
  let currentStage = "", currentCaption = "", measuredWidth = 0;

  const clamp = value => Math.max(0, Math.min(1, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, t) => {const p = clamp((t - a) / (b - a)); return p * p * (3 - 2 * p);};
  const pulse = (t, center, spread = 0.15) => Math.exp(-(((t - center) / spread) ** 2));
  const interpolate = (a, b, p) => [mix(a[0], b[0], p), mix(a[1], b[1], p)];
  const segment = (a, b, start, end, t) => interpolate(a, b, smooth(start, end, t));
  const stages = [
    {key: "intro", until: 3.4, label: "JABASYS PRESENTA", title: ["TouchValidator"], caption: "El gesto empieza contigo."},
    {key: "record", until: 10.2, label: "01 / GRABA", title: ["Tu dedo marca", "el recorrido."], caption: "Abre el panel flotante, graba dos toques y un deslizamiento."},
    {key: "save", until: 13.4, label: "02 / GUARDA", title: ["Una secuencia.", "Lista para volver."], caption: "Ponle un nombre y guarda la secuencia desde el panel."},
    {key: "replay", until: 22.5, label: "03 / REPITE", title: ["Mismos gestos.", "Tú tienes el control."], caption: "Dos ciclos a 2×, con el progreso en el panel flotante."},
    {key: "outro", until: 27, label: "TOUCHVALIDATOR", title: ["Graba una vez.", "Repite a tu ritmo."], caption: "Graba una vez. Repite a tu ritmo."}
  ];
  const getStage = t => stages.find(stage => t < stage.until) || stages[4];

  function box(x, y, w, h, radius, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
    if (fill) {ctx.fillStyle = fill; ctx.fill();}
    if (stroke) {ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke();}
  }
  function text(value, x, y, size = 22, color = ink, weight = 500, align = "left") {
    ctx.font = `${weight} ${size}px "Manrope", "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
    ctx.fillText(value, x, y);
  }
  function circle(x, y, radius, color, line = 0) {
    ctx.beginPath(); ctx.arc(x, y, Math.max(0.01, radius), 0, Math.PI * 2);
    if (line) {ctx.strokeStyle = color; ctx.lineWidth = line; ctx.stroke();}
    else {ctx.fillStyle = color; ctx.fill();}
  }
  function brand(x, y, size) {
    ctx.save();
    ctx.shadowColor = "#d2d9e43a"; ctx.shadowBlur = size * 0.36;
    box(x, y, size, size, size * 0.24, "#11151b", "#5b6573");
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.roundRect(x + 2, y + 2, size - 4, size - 4, size * 0.23); ctx.clip();
    if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, x + 2, y + 2, size - 4, size - 4);
    else text("T", x + size / 2, y + size * 0.73, size * 0.58, ink, 650, "center");
    ctx.restore();
  }
  function check(x, y, amount, color = silver) {
    const points = [[x - 9, y], [x - 2, y + 7], [x + 12, y - 9]];
    const p = clamp(amount) * 2;
    ctx.beginPath(); ctx.moveTo(...points[0]);
    for (let i = 0; i < Math.ceil(p); i++) {
      const from = points[i], to = points[i + 1], part = clamp(p - i);
      ctx.lineTo(mix(from[0], to[0], part), mix(from[1], to[1], part));
    }
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
  }

  function background(t) {
    const fill = ctx.createLinearGradient(0, 0, width, height);
    fill.addColorStop(0, "#0c0e12"); fill.addColorStop(0.55, "#171b22"); fill.addColorStop(1, "#080a0d");
    ctx.fillStyle = fill; ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width * 0.72, height * 0.5, 10, width * 0.72, height * 0.5, width * 0.6);
    glow.addColorStop(0, "#b6c0ce17"); glow.addColorStop(1, "#b6c0ce00");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    for (let x = 28; x < width; x += 42) for (let y = 28; y < height; y += 42) circle(x, y, 0.8, "#c4cedb13");
    ctx.save(); ctx.translate(width * 0.74, height * 0.51); ctx.rotate(t * 0.025);
    ctx.strokeStyle = "#c5d0df19"; ctx.lineWidth = 1; ctx.setLineDash([5, 15]);
    ctx.beginPath(); ctx.ellipse(0, 0, width * 0.32, height * 0.49, -0.45, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    // Fixed seeds keep every particle in the same place when seeking or replaying.
    for (let i = 0; i < 25; i++) {
      const x = ((i * 173.7 + t * (4 + i % 4)) % (width + 80)) - 40;
      const y = height * (0.12 + ((i * 0.137) % 0.78)) + Math.sin(t * 0.4 + i) * 18;
      circle(x, y, i % 6 === 0 ? 2.1 : 1, `rgba(198,207,219,${0.10 + Math.sin(i + t * 0.5) * 0.05})`);
    }
    ctx.save();
    const light = ctx.createLinearGradient(0, 0, width, height);
    light.addColorStop(0, "#d9e1eb00"); light.addColorStop(0.5, "#d9e1eb0b"); light.addColorStop(1, "#d9e1eb00");
    ctx.strokeStyle = light; ctx.lineWidth = portrait ? 54 : 90;
    ctx.beginPath(); ctx.moveTo(-120, height * 0.8);
    ctx.bezierCurveTo(width * 0.3, height * 0.6, width * 0.5, height * 0.2, width + 100, height * 0.1);
    ctx.stroke(); ctx.restore();
  }

  function bookend(t, closing, alpha) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    const center = width / 2;
    const size = portrait ? 134 : 112;
    const base = portrait ? 264 : 167;
    const pulse = Math.sin(t * 1.3) * 5;
    circle(center, base + size / 2, size * 0.89 + pulse, "#d2d9e428", 1);
    circle(center, base + size / 2, size * 1.2 - pulse, "#d2d9e413", 1);
    ctx.save();
    const entrance = closing ? smooth(22.35, 23.35, t) : smooth(0, 1.1, t);
    ctx.translate(center, base + size / 2);
    const scale = 0.86 + entrance * 0.14;
    ctx.scale(scale, scale); ctx.rotate((1 - entrance) * -0.10);
    brand(-size / 2, -size / 2, size);
    ctx.restore();
    text(closing ? "TU PRÓXIMA RUTINA" : "JABASYS PRESENTA", center, base - 48, portrait ? 19 : 16, muted, 600, "center");
    if (closing) {
      text("Graba una vez.", center, base + size + (portrait ? 107 : 92), portrait ? 69 : 70, ink, 650, "center");
      text("Repite a tu ritmo.", center, base + size + (portrait ? 191 : 178), portrait ? 65 : 70, silver, 650, "center");
      text("TouchValidator · by JABASYS", center, base + size + (portrait ? 272 : 248), portrait ? 25 : 22, muted, 400, "center");
      box(center - 109, base + size + (portrait ? 331 : 295), 218, 45, 22, "#d2d9e414", "#5c6675");
      text("GRABA / GUARDA / REPITE", center, base + size + (portrait ? 360 : 324), 13, silver, 600, "center");
    } else {
      text("TouchValidator", center, base + size + (portrait ? 115 : 105), portrait ? 72 : 86, ink, 650, "center");
      text("Graba una vez.", center, base + size + (portrait ? 194 : 164), portrait ? 32 : 26, muted, 400, "center");
      text("Repite a tu ritmo.", center, base + size + (portrait ? 240 : 202), portrait ? 32 : 26, silver, 500, "center");
      const load = smooth(0, 2.5, t);
      box(center - 60, base + size + (portrait ? 296 : 253), 120, 3, 2, "#353d49");
      if (load > 0) box(center - 60, base + size + (portrait ? 296 : 253), 120 * load, 3, 2, silver);
    }
    const trace = closing ? 1 : smooth(0.2, 2.6, t);
    ctx.save(); ctx.globalAlpha *= 0.38; ctx.strokeStyle = silver; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= Math.ceil(trace * 100); i++) {
      const p = i / 100;
      const angle = p * Math.PI * 1.6 - Math.PI;
      const x = center + Math.cos(angle) * (portrait ? 245 : 360);
      const y = base + size / 2 + Math.sin(angle) * (portrait ? 180 : 110);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  function replayState(t) {
    const paused = t >= 18.9 && t < 20.15;
    const elapsed = Math.max(0, t - 14.4) - Math.max(0, Math.min(t, 20.15) - 18.9);
    const finished = elapsed >= 6.6;
    return {paused, waiting: t < 14.4, finished, cycle: finished ? 2 : Math.min(2, Math.floor(elapsed / 3.3) + 1), raw: finished ? 6.6 : (elapsed % 3.3) * 2};
  }

  function capturedSteps(u) {
    return (u >= 0.7 ? 1 : 0) + (u >= 4.4 ? 1 : 0) + (u >= 5.2 ? 1 : 0);
  }

  function icon(kind, x, y, color = panelSilver, size = 16) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 24, size / 24);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.8; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (kind === "record") circle(0, 0, 5.5, color);
    else if (kind === "play") {ctx.beginPath(); ctx.moveTo(-5, -7); ctx.lineTo(7, 0); ctx.lineTo(-5, 7); ctx.closePath(); ctx.fill();}
    else if (kind === "pause") {ctx.beginPath(); ctx.moveTo(-4, -7); ctx.lineTo(-4, 7); ctx.moveTo(4, -7); ctx.lineTo(4, 7); ctx.stroke();}
    else if (kind === "stop") box(-6, -6, 12, 12, 2, color);
    else if (kind === "plus") {ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.stroke();}
    else if (kind === "check") check(0, 0, 1, color);
    ctx.restore();
  }

  function waveform(x, y, w, t, color) {
    const bars = 26, gap = w / bars;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = "round";
    for (let i = 0; i < bars; i++) {
      const amplitude = 2 + (Math.sin(i * 1.71 + t * 5) * 0.5 + 0.5) * 8;
      ctx.beginPath(); ctx.moveTo(x + i * gap, y - amplitude); ctx.lineTo(x + i * gap, y + amplitude); ctx.stroke();
    }
    ctx.restore();
  }

  function particles(x, y, age, color = panelSilver) {
    if (age < 0 || age > 1.15) return;
    ctx.save(); ctx.globalAlpha *= (1 - smooth(0.5, 1.15, age));
    for (let i = 0; i < 14; i++) {
      const angle = i * 2.39996;
      const speed = 26 + i % 4 * 12;
      const px = x + Math.cos(angle) * speed * age;
      const py = y + Math.sin(angle) * speed * age + age * age * 26;
      ctx.save(); ctx.translate(px, py); ctx.rotate(angle + age * 2);
      box(-1.4, -1.4, i % 3 === 0 ? 5 : 2.8, 2.8, 1, i % 4 === 0 ? "#f2f5fa" : color);
      ctx.restore();
    }
    ctx.restore();
  }

  function hand(x, y, press = 0, opacity = 1, angle = -0.24) {
    if (opacity <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    const scale = 0.54 * (1 - press * 0.075);
    ctx.scale(scale, scale); ctx.globalAlpha *= opacity;
    const skin = ctx.createLinearGradient(-20, 0, 70, 174);
    skin.addColorStop(0, "#fff7ec"); skin.addColorStop(0.45, "#eed9c7"); skin.addColorStop(1, "#c7a98c");
    ctx.shadowColor = "#00000055"; ctx.shadowBlur = 15; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 9;
    ctx.beginPath(); ctx.moveTo(-10, 109); ctx.lineTo(-10, 13);
    ctx.quadraticCurveTo(-10, -2, 0, -2); ctx.quadraticCurveTo(11, -2, 11, 13); ctx.lineTo(11, 68);
    ctx.bezierCurveTo(14, 49, 32, 46, 37, 68);
    ctx.bezierCurveTo(40, 54, 59, 54, 65, 81);
    ctx.bezierCurveTo(70, 68, 88, 72, 88, 93);
    ctx.quadraticCurveTo(91, 129, 75, 149); ctx.quadraticCurveTo(67, 161, 57, 168);
    ctx.lineTo(55, 191); ctx.lineTo(8, 191); ctx.lineTo(5, 167);
    ctx.quadraticCurveTo(-5, 157, -16, 137); ctx.lineTo(-42, 101);
    ctx.bezierCurveTo(-53, 87, -43, 73, -32, 79); ctx.quadraticCurveTo(-24, 83, -10, 109);
    ctx.closePath(); ctx.fillStyle = skin; ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.strokeStyle = "#a9866b"; ctx.lineWidth = 1.6; ctx.stroke();
    box(-6.4, 9, 13, 22, 6, "#fffaf2b0", "#d3bba580");
    ctx.strokeStyle = "#b68e7355"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-6, 54); ctx.quadraticCurveTo(0, 58, 7, 54);
    ctx.moveTo(23, 91); ctx.lineTo(28, 114); ctx.moveTo(49, 94); ctx.lineTo(53, 120);
    ctx.moveTo(70, 103); ctx.lineTo(70, 123); ctx.moveTo(2, 130); ctx.quadraticCurveTo(18, 120, 31, 130);
    ctx.moveTo(13, 151); ctx.quadraticCurveTo(29, 140, 53, 146); ctx.stroke();
    ctx.strokeStyle = "#fffdf3a0"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-7, 39); ctx.lineTo(-7, 104); ctx.stroke();
    box(4, 175, 56, 27, 5, "#303844", "#8793a5");
    box(7, 178, 50, 3, 1, "#d2d9e48c"); circle(50, 191, 2, "#dbe3ed");
    ctx.restore();
  }

  function handPose(t, phase) {
    if (phase === "record") {
      if (t < 4.55) return {point: segment([220, 520], [163, 316], 3.4, 4.0, t), press: pulse(t, 4.12), opacity: 1 - smooth(4.25, 4.55, t)};
      const u = t - 4.5;
      let point;
      if (u < 0.7) point = segment([140, 425], [88, 226], 0.05, 0.7, u);
      else if (u < 1.35) point = [88, 226];
      else if (u < 1.8) point = segment([88, 226], strokePoint(0), 1.35, 1.8, u);
      else if (u < 4.4) point = strokePoint(smooth(1.8, 4.4, u));
      else if (u < 5.15) point = segment(strokePoint(1), [219, 469], 4.4, 5.15, u);
      else point = segment([219, 469], [267, 568], 5.45, 5.9, u);
      return {point, press: Math.max(pulse(u, 0.78, 0.21), u >= 1.8 && u <= 4.4 ? 0.65 : 0, pulse(u, 5.25, 0.18)), opacity: smooth(0.02, 0.30, u) * (1 - smooth(5.45, 5.75, u))};
    }
    if (phase === "save" && t < 12.65) return {point: segment([285, 510], [163, 336], 11.7, 12.12, t), press: pulse(t, 12.25), opacity: smooth(11.6, 11.95, t) * (1 - smooth(12.4, 12.65, t))};
    if (phase === "replay") {
      if (t < 14.75) return {point: segment([251, 505], [163, 336], 13.45, 13.98, t), press: pulse(t, 14.15), opacity: smooth(13.4, 13.65, t) * (1 - smooth(14.4, 14.75, t))};
      if (t >= 18 && t < 19.15) return {point: segment([-83, 270], [-4, 158], 18, 18.28, t), press: smooth(18.28, 18.38, t), opacity: smooth(18, 18.15, t) * (1 - smooth(18.96, 19.15, t)), angle: 0.65};
      if (t >= 19.55 && t < 20.55) return {point: segment([250, 490], [163, 301], 19.55, 19.96, t), press: pulse(t, 20.08), opacity: smooth(19.55, 19.75, t) * (1 - smooth(20.25, 20.55, t))};
    }
    return null;
  }

  function panelButton(x, y, w, label, kind, primary, press = 0) {
    const shift = press * 1.5;
    box(x, y + shift, w, 40, 10, primary ? panelSilver : "#262c35", primary ? null : "#454e5b");
    if (press > 0.01) box(x + 2, y + shift + 2, w - 4, 36, 8, `rgba(255,255,255,${press * 0.24})`);
    icon(kind, x + 21, y + 20 + shift, primary ? "#171b22" : panelSilver, 15);
    text(label, x + w / 2 + 7, y + 25 + shift, 12, primary ? "#171b22" : ink, 650, "center");
  }

  function floatingPanel(t, phase, raw) {
    const state = replayState(t);
    const pauseMenu = phase === "replay" && t >= 18.9 && t < 20.42;
    const mode = phase === "save" ? "save" : pauseMenu ? "pause" : phase === "replay" ? "play" : "record";
    let expansion = phase === "record" ? 1 - smooth(4.25, 4.65, t)
      : phase === "save" ? smooth(10.2, 10.45, t)
      : pauseMenu ? smooth(18.9, 19.14, t) * (1 - smooth(20.15, 20.42, t))
      : 1 - smooth(14.2, 14.65, t);
    expansion = clamp(expansion);
    const x = 28, w = 270, y = mix(64, mode === "record" ? 146 : mode === "pause" ? 154 : 166, expansion);
    const h = mix(82, mode === "pause" ? 250 : 248, expansion);
    ctx.save();
    ctx.shadowColor = "#00000085"; ctx.shadowBlur = 22; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 10;
    box(x, y, w, h, 18, "#171b22f5", "#58616e");
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    // A bright top edge and drag grip give the panel a separate physical layer.
    box(x + 108, y + 6, 54, 3, 2, "#bcc5d245");
    if (expansion > 0.01) {
      ctx.save(); ctx.globalAlpha *= expansion;
      brand(x + 15, y + 16, 25);
      text("TOUCHVALIDATOR", x + 50, y + 25, 8, panelSilver, 700);
      text("Panel de sesión", x + 50, y + 39, 11, ink, 600);
      text("−", x + w - 41, y + 34, 18, muted, 400, "center");
      text("×", x + w - 21, y + 34, 17, muted, 400, "center");
      ctx.beginPath(); ctx.moveTo(x + 14, y + 54); ctx.lineTo(x + w - 14, y + 54);
      ctx.strokeStyle = "#3e4652"; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.rect(x + 10, y + 57, w - 20, Math.max(0, h - 64)); ctx.clip();
      if (mode === "pause") {
        text("La sesión está pausada", x + 15, y + 81, 16, ink, 650);
        text("Continúa desde donde te quedaste.", x + 15, y + 104, 10, muted, 400);
        panelButton(x + 15, y + 127, w - 30, "Continuar sesión", "play", true, pulse(t, 20.08));
        panelButton(x + 15, y + 177, w - 30, "Terminar sesión", "stop", false);
        text("Paso 2 / 3 · Ciclo 2 / 2", x + w / 2, y + 235, 10, muted, 400, "center");
      } else if (mode === "save" && t >= 12.4) {
        const pop = smooth(12.4, 12.8, t);
        circle(x + w / 2, y + 98, 21 + pop * 5, "#d8dfe918");
        check(x + w / 2, y + 98, smooth(12.4, 12.7, t), panelSilver);
        text("Rutina 01", x + w / 2, y + 146, 23, ink, 650, "center");
        text("3 pasos guardados", x + w / 2, y + 173, 12, muted, 400, "center");
        box(x + 22, y + 190, w - 44, 31, 8, "#303a45");
        text("Lista en tu biblioteca", x + w / 2, y + 210, 11, panelSilver, 600, "center");
      } else {
        text(mode === "save" ? "Guardar grabación" : mode === "play" ? "Grabación seleccionada" : "Nueva grabación", x + 15, y + 79, 16, ink, 650);
        box(x + 15, y + 94, w - 30, 38, 8, "#262c35", mode === "save" ? "#d8dfe9" : "#454e5b");
        const name = mode === "save" ? "Rutina 01".slice(0, Math.round(9 * smooth(10.45, 11.5, t))) : "Rutina 01";
        text(name || "Nombre de la grabación", x + 28, y + 118, 13, name ? ink : muted, 500);
        if (mode === "save" && t < 11.65 && Math.sin(t * 12) > 0) {
          ctx.beginPath(); ctx.moveTo(x + 29 + ctx.measureText(name).width, y + 104); ctx.lineTo(x + 29 + ctx.measureText(name).width, y + 121);
          ctx.strokeStyle = panelSilver; ctx.lineWidth = 1; ctx.stroke();
        }
        const press = mode === "save" ? pulse(t, 12.25) : mode === "play" ? pulse(t, 14.15) : pulse(t, 4.12);
        panelButton(x + 15, y + 150, w - 30, mode === "save" ? "Guardar grabación" : mode === "play" ? "Iniciar sesión" : "Comenzar a grabar", mode === "save" ? "check" : mode === "play" ? "play" : "record", true, press);
        text(mode === "play" ? "2 ciclos · 2× · Prueba de gestos" : mode === "save" ? "Tus gestos, con su propio nombre." : "El panel te acompaña sobre la app.", x + w / 2, y + 216, 10, muted, 400, "center");
      }
      ctx.restore();
    }
    if (expansion < 0.99) {
      ctx.save(); ctx.globalAlpha *= 1 - expansion;
      const recording = phase === "record", color = recording ? recordAccent : state.paused ? muted : panelSilver;
      circle(x + 18, y + 24, 3.4, color);
      text(recording ? "GRABACIÓN GENERAL" : state.finished ? "SECUENCIA COMPLETADA" : state.paused ? "SESIÓN PAUSADA" : "SESIÓN EN CURSO", x + 29, y + 28, 9, color, 700);
      const count = capturedSteps(raw);
      text(recording ? `${count} ${count === 1 ? "paso capturado" : "pasos capturados"}` : state.finished ? "2 ciclos completados" : `Ciclo ${state.cycle} / 2 · Paso ${count} / 3`, x + 16, y + 48, 12, ink, 600);
      const amount = recording ? clamp((t - 4.5) / 5.7) : clamp(raw / 6.6);
      box(x + 16, y + 61, w - 32, 3, 1, "#3e4652");
      if (amount > 0) box(x + 16, y + 61, (w - 32) * amount, 3, 1, color);
      circle(x + 16 + (w - 32) * amount, y + 62, 3, color);
      ctx.restore();
    }
    ctx.restore();
    if (phase === "save") particles(163, y + 98, t - 12.4);
    const contact = mode === "save" ? 12.25 : mode === "record" ? 4.12 : mode === "pause" ? 20.08 : 14.15;
    const contactY = mode === "pause" ? 301 : mode === "record" ? 316 : 336;
    if (expansion > 0.85) touch(163, contactY, t - contact);
  }

  function strokePoint(p) {
    const a = 1 - p;
    return [a ** 3 * 68 + 3 * a * a * p * 116 + 3 * a * p * p * 185 + p ** 3 * 256,
      a ** 3 * 374 + 3 * a * a * p * 374 + 3 * a * p * p * 326 + p ** 3 * 326];
  }
  function trail(amount, color, lineWidth = 3) {
    if (amount <= 0) return;
    ctx.beginPath(); ctx.moveTo(...strokePoint(0));
    const count = Math.max(2, Math.ceil(amount * 50));
    for (let i = 1; i <= count; i++) ctx.lineTo(...strokePoint(amount * i / count));
    ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = lineWidth > 3 ? 9 : 0;
    ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.lineCap = "round"; ctx.stroke(); ctx.restore();
  }
  function touch(x, y, age) {
    if (age < 0 || age > 1.05) return;
    const p = clamp(age / 1.05);
    circle(x, y, 16 + p * 25, `rgba(210,217,228,${0.7 * (1 - p)})`, 2);
    circle(x, y, 12, "#d2d9e424"); circle(x, y, 6, "#ffffff");
    circle(x, y, 9 + p * 16, `rgba(240,243,249,${0.55 * (1 - p)})`, 1);
  }
  function gestures(u, replay) {
    const swipe = smooth(1.8, 4.4, u);
    if (replay) trail(1, "#d2d9e426", 2);
    trail(swipe, replay ? "#eef2f8" : silver, 3.5);
    if (u >= 0.9) circle(88, 226, 5, "#d2d9e440");
    if (u >= 5.4) circle(219, 469, 5, "#d2d9e440");
    touch(88, 226, u - 0.7);
    touch(219, 469, u - 5.2);
    if (u >= 1.8 && u < 4.4) {
      const [x, y] = strokePoint(swipe);
      circle(x, y, 17, "#d2d9e423"); circle(x, y, 8, ink); circle(x, y, 11, silver, 2);
    }
  }

  function phone(t, phase) {
    const scale = portrait ? 1.13 : 1.06;
    const x = portrait ? (width - 326 * scale) / 2 : 821;
    const y = (portrait ? 375 : 66) + Math.sin(t * 0.8) * 3;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.shadowColor = "#00000070"; ctx.shadowBlur = 42; ctx.shadowOffsetY = 20;
    box(0, 0, 326, 558, 36, "#080a0d", "#657080"); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    box(-4, 132, 5, 58, 3, "#66707d"); box(-4, 214, 5, 30, 3, "#414954");
    box(10, 10, 306, 537, 29, "#12161d");
    box(114, 17, 98, 15, 10, "#060709");
    text("9:41", 25, 34, 10, muted, 500);
    box(282, 25, 16, 8, 2, "#a8b2c1");
    brand(26, 57, 29); text("TouchValidator", 65, 78, 18, ink, 650);
    text("Pantalla de prueba", 26, 110, 15, muted, 400);
    const replay = phase === "replay";
    const recording = phase === "record";
    const state = replayState(t);
    box(26, 132, 274, 34, 9, recording ? "#2d36422d" : "#303a4550", recording ? "#586575" : "#4b5562");
    circle(42, 149, 4, recording ? "#b8c2cf" : silver);
    text(recording ? "GRABANDO" : replay ? state.paused ? "SESIÓN PAUSADA" : state.waiting ? "SECUENCIA LISTA" : state.finished ? "2 CICLOS COMPLETADOS" : `REPRODUCIENDO · CICLO ${state.cycle} / 2` : "RUTINA GUARDADA", 54, 153, 11, recording ? "#dfe5ec" : silver, 600);
    box(26, 190, 274, 72, 12, "#20242b", "#3a424d");
    circle(52, 226, 11, "#d2d9e414"); circle(52, 226, 4, silver);
    text("Primer toque", 74, 219, 17, ink, 550); text("Empieza aquí", 74, 241, 12, muted, 400);
    box(26, 281, 274, 133, 12, "#191d24", "#3a424d");
    text("Desliza a la derecha", 43, 309, 15, ink, 500);
    for (let i = 0; i < 4; i++) {ctx.beginPath(); ctx.moveTo(45, 332 + i * 18); ctx.lineTo(281, 332 + i * 18); ctx.strokeStyle = "#4f5a6960"; ctx.lineWidth = 1; ctx.stroke();}
    box(26, 437, 274, 65, 12, "#262c34", "#687484");
    text("Último toque", 47, 475, 17, ink, 550);
    circle(268, 469, 10, "#d2d9e420"); check(268, 469, 1);
    box(125, 529, 77, 4, 2, "#7c879950");
    let u = phase === "record" ? Math.max(0, t - 4.5) : 6.6;
    if (replay) u = state.raw;
    gestures(u, replay);
    if (phase === "save" || replay && state.paused) box(10, 10, 306, 537, 29, "#090c1178");
    floatingPanel(t, phase, u);
    if (replay && t >= 18.2 && t < 20.45) {
      ctx.save(); ctx.globalAlpha *= smooth(18.2, 18.4, t) * (1 - smooth(20.15, 20.45, t));
      touch(-2, 158, t - 18.28); box(-69, 111, 59, 26, 6, "#242b35", "#697689");
      text("VOL −", -39, 129, 10, silver, 650, "center"); ctx.restore();
    }
    const pose = handPose(t, phase);
    if (pose) hand(pose.point[0], pose.point[1], pose.press, pose.opacity, pose.angle);
    ctx.save(); ctx.strokeStyle = "#e4e9f244"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(17, 96); ctx.lineTo(17, 37); ctx.quadraticCurveTo(17, 17, 42, 17); ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  function scene(t, stage, alpha) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    const left = portrait ? 47 : 76;
    const top = portrait ? 73 : 96;
    text(stage.label, left, top, portrait ? 21 : 16, silver, 600);
    const stageStart = stage.key === "record" ? 3.4 : stage.key === "save" ? 10.2 : 13.4;
    const float = (1 - smooth(stageStart, stageStart + 0.55, t)) * 14;
    stage.title.forEach((line, i) => text(line, left, top + (portrait ? 74 : 94) + i * (portrait ? 67 : 74) + float, portrait ? 57 : 64, i ? silver : ink, 650));
    const state = replayState(t);
    const description = {
      record: ["Dos toques. Un deslizamiento.", "El panel flotante registra cada paso."],
      save: ["Ponle un nombre y hazla tuya.", "Guárdala desde el panel, sin salir de la app."],
      replay: state.paused ? ["Mantén Volumen abajo para pausar.", "Continúa desde el menú flotante."] : ["Dos ciclos a velocidad 2×.", "El panel te muestra el progreso."]
    };
    if (portrait) text(description[stage.key][0], left, top + 242, 23, muted, 400);
    else description[stage.key].forEach((line, i) => text(line, left, top + 262 + i * 33, 22, muted, 400));
    if (!portrait) {
      const raw = stage.key === "record" ? Math.max(0, t - 4.5) : stage.key === "replay" ? state.raw : 6.6;
      const active = stage.key === "record" ? t >= 4.5 : stage.key === "replay" && !state.paused && !state.waiting && !state.finished;
      const status = stage.key === "record" ? t < 4.5 ? "ABRE EL PANEL PARA EMPEZAR" : "CAPTURANDO TUS GESTOS"
        : stage.key === "save" ? t < 12.4 ? "DALE UN NOMBRE A TU SECUENCIA" : "3 PASOS GUARDADOS"
        : state.paused ? "PAUSADA · CONTINÚA DESDE EL PANEL" : state.finished ? "2 CICLOS COMPLETADOS" : state.waiting ? "LISTA PARA REPRODUCIR" : `CICLO ${state.cycle} DE 2 · VELOCIDAD 2×`;
      circle(left + 4, 414, 3, stage.key === "record" ? recordAccent : silver);
      text(status, left + 16, 418, 10, muted, 600);
      if (active) waveform(left + 326, 413, 124, t, stage.key === "record" ? recordAccent : silver);
      ["Primer toque", "Deslizamiento", "Último toque"].forEach((label, i) => {
        const start = [0.7, 1.8, 5.2][i], end = [1.4, 4.4, 5.9][i];
        const p = smooth(start, end, raw);
        box(left, 443 + i * 57, 458, 46, 10, p ? "#282f3980" : "#1b1f2580", p >= 1 ? "#656f7e" : "#363d47");
        text(`0${i + 1}`, left + 17, 472 + i * 57, 13, muted, 400);
        text(label, left + 58, 473 + i * 57, 16, ink, 500);
        box(left + 313, 464 + i * 57, 99, 4, 2, "#474f5b");
        if (p > 0) box(left + 313, 464 + i * 57, 99 * p, 4, 2, silver);
        if (p >= 1) check(left + 436, 467 + i * 57, 1);
      });
    }
    phone(t, stage.key);
    if (stage.key === "replay") {
      const x = portrait ? width / 2 - 143 : 864;
      const y = portrait ? 1090 : 678;
      box(x, y - 28, 286, 39, 19, "#202731", "#566170");
      text(state.paused ? "VOL −     /     SESIÓN PAUSADA" : "VELOCIDAD 2×     /     2 CICLOS", x + 143, y - 3, portrait ? 15 : 13, silver, 600, "center");
    }
    ctx.restore();
  }

  function render() {
    ctx.save(); ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    ctx.globalAlpha = 1; ctx.clearRect(0, 0, width, height);
    background(position);
    const opening = smooth(2.5, 3.4, position);
    const ending = smooth(22.35, 23.35, position);
    bookend(position, false, 1 - opening);
    const stage = getStage(position);
    scene(position, stage.key === "intro" ? stages[1] : stage.key === "outro" ? stages[3] : stage, opening * (1 - ending));
    bookend(position, true, ending);
    ctx.restore();
  }

  function update() {
    const stage = getStage(position);
    if (stage.key !== currentStage) {
      currentStage = stage.key;
      player.dataset.phase = stage.key;
      steps.forEach(item => {const active = item.dataset.introStep === stage.key; item.classList.toggle("is-active", active); if (active) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");});
    }
    const state = replayState(position);
    const nextCaption = stage.key === "replay" && state.paused ? "Mantén Volumen abajo para pausar. Continúa desde el panel flotante."
      : stage.key === "replay" && position >= 20.15 ? "La secuencia continúa donde se quedó. Segundo ciclo a 2×."
      : stage.caption;
    if (nextCaption !== currentCaption) {currentCaption = nextCaption; caption.textContent = nextCaption;}
    const end = position >= duration;
    toggle.setAttribute("aria-label", playing ? "Pausar introducción" : end ? "Volver a ver la introducción" : "Reproducir introducción");
    toggle.querySelector("span").textContent = playing ? "Pausar" : end ? "Volver a ver" : "Reproducir";
    toggle.querySelector("use").setAttribute("href", playing ? "#icon-pause" : "#icon-play");
    player.classList.toggle("is-playing", playing);
    progress.value = String(position);
    progress.setAttribute("aria-valuetext", `${Math.floor(position)} de ${duration} segundos`);
    progress.style.setProperty("--intro-progress", `${position / duration * 100}%`);
    clock.textContent = `0:${String(Math.floor(position)).padStart(2, "0")} / 0:26`;
  }
  function stop() {
    playing = false; cancelAnimationFrame(frameId); frameId = 0; lastTime = 0; update();
  }
  function tick(now) {
    if (!playing) return;
    if (lastTime) position = Math.min(duration, position + Math.min((now - lastTime) / 1000, 0.1));
    lastTime = now;
    render(); update();
    if (position >= duration) {wanted = false; stop();}
    else frameId = requestAnimationFrame(tick);
  }
  function play() {
    if (playing || !visible || document.hidden) return;
    if (position >= duration) position = 0;
    playing = true; started = true; lastTime = 0; update(); frameId = requestAnimationFrame(tick);
  }
  function seek(value) {
    wanted = false; stop(); position = Math.max(0, Math.min(duration, value)); started = true; update(); render();
  }
  toggle.addEventListener("click", () => {wanted = !playing; if (wanted) play(); else stop();});
  restart.addEventListener("click", () => {position = 0; wanted = true; stop(); render(); play();});
  progress.addEventListener("input", () => seek(Number(progress.value)));
  progress.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const amount = event.shiftKey ? 5 : 1;
    seek(event.key === "Home" ? 0 : event.key === "End" ? duration : position + (event.key === "ArrowRight" ? amount : -amount));
  });
  document.addEventListener("visibilitychange", () => {if (document.hidden) stop(); else if (wanted) play();});
  motion.addEventListener("change", event => {if (event.matches) {wanted = false; stop();}});
  function resize() {
    const measured = canvas.getBoundingClientRect().width;
    if (measured <= 0 || measured === measuredWidth) return;
    measuredWidth = measured; portrait = measured < 650;
    width = portrait ? 720 : 1280; height = portrait ? 1120 : 720;
    canvas.classList.toggle("is-portrait", portrait);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(measured * ratio);
    canvas.height = Math.round(measured * height / width * ratio);
    render();
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) stop();
    else {
      if (!started && !motion.matches) wanted = true;
      if (wanted) play();
    }
  }, {threshold: 0.2}).observe(canvas);
  logo.onload = render; logo.src = "assets/brand.png";
  resize(); update();
  document.fonts.ready.then(render);
})();
