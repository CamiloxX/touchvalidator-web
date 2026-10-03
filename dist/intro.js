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
  const ink = "#f3faf5";
  const mint = "#91f5b6";
  const muted = "#9bb3a4";
  let width = 1280, height = 720, portrait = false;
  let position = 0, frameId = 0, lastTime = 0;
  let playing = false, wanted = false, visible = false, started = false;
  let currentStage = "", measuredWidth = 0;

  const clamp = value => Math.max(0, Math.min(1, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, t) => {const p = clamp((t - a) / (b - a)); return p * p * (3 - 2 * p);};
  const stages = [
    {key: "intro", until: 3.4, label: "JABASYS PRESENTA", title: ["TouchValidator"], caption: "El gesto empieza contigo."},
    {key: "record", until: 10.2, label: "01 / GRABA", title: ["Cada toque.", "Cada recorrido."], caption: "Captura tus toques, recorridos y pausas."},
    {key: "save", until: 13.4, label: "02 / GUARDA", title: ["Tu rutina.", "Siempre a mano."], caption: "Dale un nombre. Encuéntrala en tu biblioteca."},
    {key: "replay", until: 22.5, label: "03 / REPITE", title: ["Mismo gesto.", "Tu propio ritmo."], caption: "El mismo recorrido. Dos ciclos a velocidad 2×."},
    {key: "outro", until: 27, label: "TOUCHVALIDATOR", title: ["Graba una vez.", "Repite a tu ritmo."], caption: "Graba una vez. Repite a tu ritmo."}
  ];
  const getStage = t => stages.find(stage => t < stage.until) || stages[4];

  function box(x, y, w, h, radius, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
    if (fill) {ctx.fillStyle = fill; ctx.fill();}
    if (stroke) {ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke();}
  }
  function text(value, x, y, size = 22, color = ink, weight = 500, align = "left") {
    ctx.font = `${weight} ${size}px "Segoe UI", Arial, sans-serif`;
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
    ctx.shadowColor = "#91f5b63a"; ctx.shadowBlur = size * 0.36;
    box(x, y, size, size, size * 0.24, "#101816", "#476750");
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.roundRect(x + 2, y + 2, size - 4, size - 4, size * 0.23); ctx.clip();
    if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, x + 2, y + 2, size - 4, size - 4);
    else text("T", x + size / 2, y + size * 0.73, size * 0.58, ink, 650, "center");
    ctx.restore();
  }
  function check(x, y, amount, color = mint) {
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
    fill.addColorStop(0, "#0b1410"); fill.addColorStop(0.55, "#10231a"); fill.addColorStop(1, "#07100d");
    ctx.fillStyle = fill; ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width * 0.72, height * 0.5, 10, width * 0.72, height * 0.5, width * 0.6);
    glow.addColorStop(0, "#81efaa17"); glow.addColorStop(1, "#81efaa00");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    for (let x = 28; x < width; x += 42) for (let y = 28; y < height; y += 42) circle(x, y, 0.8, "#9ad4ae13");
    ctx.save(); ctx.translate(width * 0.74, height * 0.51); ctx.rotate(t * 0.025);
    ctx.strokeStyle = "#89e2a819"; ctx.lineWidth = 1; ctx.setLineDash([5, 15]);
    ctx.beginPath(); ctx.ellipse(0, 0, width * 0.32, height * 0.49, -0.45, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function bookend(t, closing, alpha) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    const center = width / 2;
    const size = portrait ? 134 : 112;
    const base = portrait ? 264 : 167;
    const pulse = Math.sin(t * 1.3) * 5;
    circle(center, base + size / 2, size * 0.89 + pulse, "#91f5b628", 1);
    circle(center, base + size / 2, size * 1.2 - pulse, "#91f5b613", 1);
    brand(center - size / 2, base, size);
    text(closing ? "TU PRÓXIMA RUTINA" : "JABASYS PRESENTA", center, base - 48, portrait ? 19 : 16, muted, 600, "center");
    if (closing) {
      text("Graba una vez.", center, base + size + (portrait ? 107 : 92), portrait ? 69 : 70, ink, 650, "center");
      text("Repite a tu ritmo.", center, base + size + (portrait ? 191 : 178), portrait ? 65 : 70, mint, 650, "center");
      text("TouchValidator · by JABASYS", center, base + size + (portrait ? 272 : 248), portrait ? 25 : 22, muted, 400, "center");
      box(center - 109, base + size + (portrait ? 331 : 295), 218, 45, 22, "#91f5b614", "#496a54");
      text("GRABA / GUARDA / REPITE", center, base + size + (portrait ? 360 : 324), 13, mint, 600, "center");
    } else {
      text("TouchValidator", center, base + size + (portrait ? 115 : 105), portrait ? 72 : 86, ink, 650, "center");
      text("Graba una vez.", center, base + size + (portrait ? 194 : 164), portrait ? 32 : 26, muted, 400, "center");
      text("Repite a tu ritmo.", center, base + size + (portrait ? 240 : 202), portrait ? 32 : 26, mint, 500, "center");
      const load = smooth(0, 2.5, t);
      box(center - 60, base + size + (portrait ? 296 : 253), 120, 3, 2, "#304e3a");
      if (load > 0) box(center - 60, base + size + (portrait ? 296 : 253), 120 * load, 3, 2, mint);
    }
    ctx.restore();
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
    ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.lineCap = "round"; ctx.stroke();
  }
  function touch(x, y, age) {
    if (age < 0 || age > 1.05) return;
    const p = clamp(age / 1.05);
    circle(x, y, 16 + p * 25, `rgba(145,245,182,${0.7 * (1 - p)})`, 2);
    circle(x, y, 12, "#91f5b624"); circle(x, y, 6, "#ebfff2");
  }
  function gestures(u, replay) {
    const swipe = smooth(1.8, 4.4, u);
    if (replay) trail(1, "#91f5b626", 2);
    trail(swipe, replay ? "#d3ffe3" : mint, 3.5);
    if (u >= 0.9) circle(88, 226, 5, "#91f5b640");
    if (u >= 5.4) circle(219, 469, 5, "#91f5b640");
    touch(88, 226, u - 0.7);
    touch(219, 469, u - 5.2);
    if (u >= 1.8 && u < 4.4) {
      const [x, y] = strokePoint(swipe);
      circle(x, y, 17, "#91f5b623"); circle(x, y, 8, ink); circle(x, y, 11, mint, 2);
    }
  }

  function phone(t, phase) {
    const scale = portrait ? 1.02 : 1.06;
    const x = portrait ? (width - 326 * scale) / 2 : 821;
    const y = (portrait ? 385 : 66) + Math.sin(t * 0.8) * 3;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.shadowColor = "#00000070"; ctx.shadowBlur = 42; ctx.shadowOffsetY = 20;
    box(0, 0, 326, 558, 36, "#060b08", "#486b52"); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    box(10, 10, 306, 537, 29, "#0e1913");
    box(114, 17, 98, 15, 10, "#050906");
    text("9:41", 25, 34, 10, muted, 500);
    box(282, 25, 16, 8, 2, "#8ba995");
    brand(26, 57, 29); text("TouchValidator", 65, 78, 18, ink, 650);
    text("Pantalla de prueba", 26, 110, 15, muted, 400);
    const replay = phase === "replay";
    const recording = phase === "record";
    box(26, 132, 274, 34, 9, recording ? "#4f29222d" : "#25493350", recording ? "#704637" : "#385843");
    circle(42, 149, 4, recording ? "#efa988" : mint);
    const cycle = t < 17.2 ? "1 / 2" : "2 / 2";
    text(recording ? "GRABANDO" : replay ? `REPRODUCIENDO · CICLO ${cycle}` : "RUTINA GUARDADA", 54, 153, 11, recording ? "#eec7b4" : mint, 600);
    box(26, 190, 274, 72, 12, "#192b20", "#304837");
    circle(52, 226, 11, "#91f5b614"); circle(52, 226, 4, mint);
    text("Primer toque", 74, 219, 17, ink, 550); text("Empieza aquí", 74, 241, 12, muted, 400);
    box(26, 281, 274, 133, 12, "#14271c", "#304837");
    text("Desliza a la derecha", 43, 309, 15, ink, 500);
    for (let i = 0; i < 4; i++) {ctx.beginPath(); ctx.moveTo(45, 332 + i * 18); ctx.lineTo(281, 332 + i * 18); ctx.strokeStyle = "#35544060"; ctx.lineWidth = 1; ctx.stroke();}
    box(26, 437, 274, 65, 12, "#213b29", "#4a7157");
    text("Último toque", 47, 475, 17, ink, 550);
    circle(268, 469, 10, "#91f5b620"); check(268, 469, 1);
    box(125, 529, 77, 4, 2, "#6d907950");
    let u = phase === "record" ? t - 3.4 : 6.8;
    if (replay && t < 21) u = Math.max(0, ((t - 13.4) % 3.8) * 2);
    gestures(u, replay);
    if (phase === "save") {
      box(10, 10, 306, 537, 29, "#06100cd9");
      const rise = (1 - smooth(10.2, 10.8, t)) * 30;
      ctx.save(); ctx.translate(0, rise);
      box(27, 182, 272, 219, 20, "#1b3022", "#5d8d6b");
      circle(163, 231, 23, "#91f5b618"); check(163, 231, smooth(10.6, 11.4, t));
      text("Rutina 01", 163, 285, 27, ink, 600, "center");
      text("3 gestos · 6.5 segundos", 163, 313, 13, muted, 400, "center");
      box(59, 338, 209, 36, 10, mint); text("Guardada en la biblioteca", 163, 361, 12, "#123821", 650, "center");
      ctx.restore();
    }
    ctx.restore();
  }

  function scene(t, stage, alpha) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    const left = portrait ? 47 : 76;
    const top = portrait ? 73 : 96;
    text(stage.label, left, top, portrait ? 21 : 16, mint, 600);
    const stageStart = stage.key === "record" ? 3.4 : stage.key === "save" ? 10.2 : 13.4;
    const float = (1 - smooth(stageStart, stageStart + 0.55, t)) * 14;
    stage.title.forEach((line, i) => text(line, left, top + (portrait ? 74 : 94) + i * (portrait ? 67 : 74) + float, portrait ? 57 : 64, i ? mint : ink, 650));
    const description = {
      record: ["Toca. Desliza. Deja tu recorrido.", "TouchValidator lo convierte en una secuencia."],
      save: ["Ponle un nombre y hazla tuya.", "Lista para la próxima vez."],
      replay: ["Elige la velocidad y los ciclos.", "Tus gestos vuelven a ponerse en marcha."]
    };
    if (portrait) text(description[stage.key][0], left, top + 242, 23, muted, 400);
    else description[stage.key].forEach((line, i) => text(line, left, top + 262 + i * 33, 22, muted, 400));
    if (!portrait) {
      const raw = stage.key === "record" ? t - 3.4 : stage.key === "replay" && t < 21 ? Math.max(0, ((t - 13.4) % 3.8) * 2) : 6.8;
      ["Primer toque", "Deslizamiento", "Último toque"].forEach((label, i) => {
        const start = [0.7, 1.8, 5.2][i], end = [1.4, 4.4, 5.9][i];
        const p = smooth(start, end, raw);
        box(left, 443 + i * 57, 458, 46, 10, p ? "#1c382680" : "#14241b80", p >= 1 ? "#426950" : "#294634");
        text(`0${i + 1}`, left + 17, 472 + i * 57, 13, muted, 400);
        text(label, left + 58, 473 + i * 57, 16, ink, 500);
        box(left + 313, 464 + i * 57, 99, 4, 2, "#34513d");
        if (p > 0) box(left + 313, 464 + i * 57, 99 * p, 4, 2, mint);
        if (p >= 1) check(left + 436, 467 + i * 57, 1);
      });
    }
    phone(t, stage.key);
    if (stage.key === "replay") {
      const x = portrait ? width / 2 - 143 : 864;
      const y = portrait ? 995 : 678;
      box(x, y - 28, 286, 39, 19, "#142b1d", "#416a4c");
      text("VELOCIDAD 2×     /     2 CICLOS", x + 143, y - 3, portrait ? 15 : 13, mint, 600, "center");
    }
    ctx.restore();
  }

  function render() {
    ctx.save(); ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    ctx.globalAlpha = 1; ctx.clearRect(0, 0, width, height);
    background(position);
    const opening = smooth(2.5, 3.4, position);
    const ending = smooth(22.1, 23.3, position);
    bookend(position, false, 1 - opening);
    const stage = getStage(position);
    scene(position, stage.key === "intro" ? stages[1] : stage.key === "outro" ? stages[3] : stage, opening * (1 - ending));
    bookend(position, true, ending);
    ctx.restore();
  }

  function update() {
    const stage = getStage(position);
    if (stage.key !== currentStage) {
      currentStage = stage.key; caption.textContent = stage.caption;
      player.dataset.phase = stage.key;
      steps.forEach(item => {const active = item.dataset.introStep === stage.key; item.classList.toggle("is-active", active); if (active) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");});
    }
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
    width = portrait ? 720 : 1280; height = portrait ? 1040 : 720;
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
})();
