
(function () {
    "use strict";

    const canvas = document.getElementById("output_canvas");
    if (!canvas) return;
    const screenEl = document.getElementById("screen") || document.body;

    // ---------- Ajustes rápidos ----------
    const BRAND = "Filtros con Gestos";   // texto de la polaroid si no ponés CREDIT
    const CREDIT = "@Shianlu.mp4";                    // ej: "TU NOMBRE · tu@email.com" (si está vacío, se muestra BRAND)
    const HOLD_MS = 700;                  // cuánto mantener la V
    const COUNT_FROM = 3;                 // cuenta regresiva
    const COOLDOWN_MS = 2500;             // pausa entre fotos
    const DATE_STAMP = true;              // fecha naranja de cámara digital en la esquina
    const AUTO_DOWNLOAD = false;          // true: baja la foto sola apenas se saca
    const PREVIEW_MS = 20000;             // cuánto se queda la vista previa

    // clase del <body> -> paleta del marco
    const PALETTES = {
        aero:  { bg: ["#ffffff", "#a9defc"], ink: "#0b3556", accent: "#1c8ad8", gloss: true,  mono: false },
        xp:    { bg: ["#3a7bff", "#0831d9"], ink: "#ffffff", accent: "#ffe14d", gloss: true,  mono: false },
        w98:   { bg: ["#d8d4cc", "#b4b0a8"], ink: "#000080", accent: "#800080", gloss: false, mono: false },
        err:   { bg: ["#ff6a5a", "#9a1208"], ink: "#ffffff", accent: "#ffe14d", gloss: true,  mono: false },
        term:  { bg: ["#0b0b0b", "#000000"], ink: "#33ff66", accent: "#33ff66", gloss: false, mono: true  },
        dark:  { bg: ["#2a3f73", "#070d1c"], ink: "#dbe8ff", accent: "#7fd0ff", gloss: true,  mono: false },
    };
    const PALETTE_OF = {
        "bg-aero": "aero", "bg-dusk": "aero", "bg-xp": "xp", "bg-water": "xp", "bg-heat": "xp",
        "bg-paint": "w98", "bg-pop": "w98", "bg-error": "err", "bg-term": "term", "bg-night": "dark", "bg-lime": "dark",
    };

    // ---------- CSS ----------
    const css = `
#shotBtn { position: fixed; top: max(12px, env(safe-area-inset-top)); left: max(12px, env(safe-area-inset-left)); z-index: 20; padding: 7px 14px; border-radius: 16px; cursor: pointer;
    font: bold 13px Tahoma, Verdana, sans-serif; color: #0b3556; text-shadow: 0 0 4px #fff;
    border: 1px solid rgba(255,255,255,.9); box-shadow: 0 4px 14px rgba(0,60,120,.4), inset 0 0 8px rgba(255,255,255,.8);
    background: linear-gradient(180deg, rgba(255,255,255,.85) 0 50%, rgba(150,220,255,.7) 50% 100%); }
#shotBtn:hover { filter: brightness(1.08); }
#shotBtn:disabled { opacity: .55; cursor: default; }
@media (max-width: 600px) { #shotBtn { padding: 5px 10px; font-size: 11px; } }

#cd { position: absolute; inset: 0; z-index: 8; display: none; pointer-events: none; line-height: 1; }
#cd.on { display: block; }
#cd .co { position: absolute; width: 46px; height: 46px; border: 3px solid #fff; box-shadow: 0 0 6px rgba(0,0,0,.6); }
#cd .tl { top: 16px; left: 16px; border-right: 0; border-bottom: 0; }
#cd .tr { top: 16px; right: 16px; border-left: 0; border-bottom: 0; }
#cd .bl { bottom: 16px; left: 16px; border-right: 0; border-top: 0; }
#cd .br { bottom: 16px; right: 16px; border-left: 0; border-top: 0; }
#cd .num { position: absolute; inset: 0; display: grid; place-items: center; font: bold 190px Tahoma, Impact, sans-serif; color: #fff;
    text-shadow: 0 0 26px #38bdf8, 0 0 6px #0b3556, 0 6px 0 rgba(0,60,140,.45); }
#cd .num.pop { animation: cdPop .9s ease-out; }
@keyframes cdPop { 0% { transform: scale(1.6); opacity: 0; } 25% { transform: scale(1); opacity: 1; } 100% { transform: scale(.85); opacity: .7; } }
#cd .rec { position: absolute; top: 20px; left: 0; right: 0; text-align: center; color: #fff; font: bold 13px Tahoma, Verdana, sans-serif; text-shadow: 0 1px 3px #000; }

#shotHold { position: absolute; left: 50%; top: 12px; transform: translateX(-50%); width: 230px; padding: 6px 10px; border-radius: 14px; background: rgba(0,0,0,.7); color: #fff;
    font: bold 12px Tahoma, sans-serif; line-height: normal; text-align: center; opacity: 0; transition: opacity .15s; z-index: 7; pointer-events: none; }
#shotHold.on { opacity: 1; }
#shotHold .bar { height: 6px; margin-top: 5px; border-radius: 3px; background: rgba(255,255,255,.25); overflow: hidden; }
#shotHold .fill { height: 100%; width: 0; background: linear-gradient(90deg, #ffe14d, #ff9a2e); }

#shotFlash { position: fixed; inset: 0; background: #fff; opacity: 0; pointer-events: none; z-index: 9000; }
#shotFlash.go { animation: shotFlash .55s ease-out; }
@keyframes shotFlash { 0% { opacity: .95; } 100% { opacity: 0; } }

#pv { position: fixed; right: max(14px, env(safe-area-inset-right)); bottom: max(14px, env(safe-area-inset-bottom)); z-index: 25; width: min(250px, 60vw); padding: 8px; border-radius: 12px;
    font-family: Tahoma, Verdana, sans-serif; color: #0b3556; border: 1px solid rgba(255,255,255,.95);
    background: linear-gradient(180deg, rgba(255,255,255,.92), rgba(185,228,255,.85)); box-shadow: 0 10px 30px rgba(0,40,110,.5), inset 0 0 10px rgba(255,255,255,.8);
    transform: translateX(120%) rotate(4deg); opacity: 0; transition: transform .45s cubic-bezier(.2,1.3,.4,1), opacity .3s; }
#pv.on { transform: translateX(0) rotate(-2deg); opacity: 1; }
#pv img { display: block; width: 100%; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,.35); }
#pv .ac { display: flex; gap: 6px; margin-top: 8px; }
#pv button { flex: 1; padding: 6px 4px; border-radius: 14px; cursor: pointer; font: bold 12px Tahoma, Verdana, sans-serif; color: #0b3556;
    border: 1px solid rgba(255,255,255,.95); box-shadow: 0 2px 8px rgba(0,60,120,.35), inset 0 0 6px rgba(255,255,255,.8);
    background: linear-gradient(180deg, rgba(255,255,255,.9) 0 50%, rgba(150,220,255,.75) 50% 100%); }
#pv button:hover { filter: brightness(1.07); }
#pv button.x { flex: 0 0 34px; }
@media (prefers-reduced-motion: reduce) { #cd .num.pop, #shotFlash.go { animation: none; } #pv { transition: opacity .2s; } }
`;
    const styleEl = document.createElement("style");
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // ---------- Elementos ----------
    const btn = document.createElement("button");
    btn.id = "shotBtn"; btn.type = "button"; btn.textContent = "📷 Foto";
    btn.title = "Sacar una foto (o hacé la V con la mano)";
    document.body.appendChild(btn);

    const cd = document.createElement("div");
    cd.id = "cd";
    cd.innerHTML = '<span class="co tl"></span><span class="co tr"></span><span class="co bl"></span><span class="co br"></span><div class="rec"> ¡Sonreí! ·  filtro fijado</div><div class="num"></div>';
    screenEl.appendChild(cd);
    const numEl = cd.querySelector(".num");

    const hold = document.createElement("div");
    hold.id = "shotHold";
    hold.innerHTML = 'Filtro fijado · mantené la V<div class="bar"><div class="fill"></div></div>';
    screenEl.appendChild(hold);
    const holdFill = hold.querySelector(".fill");

    const flashEl = document.createElement("div");
    flashEl.id = "shotFlash";
    document.body.appendChild(flashEl);

    // ---------- Sonidos (contexto propio; solo si la música está activada) ----------
    let ac = null;
    function soundOn() { const mb = document.getElementById("music"); return !!mb && mb.textContent.startsWith("🔊"); }
    function ctxAudio() {
        try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); return ac; } catch (e) { return null; }
    }
    function beep(freq, dur, vol) {
        if (!soundOn()) return; const a = ctxAudio(); if (!a) return;
        const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
    }
    function shutter() {
        if (!soundOn()) return; const a = ctxAudio(); if (!a) return;
        const t = a.currentTime, len = Math.floor(a.sampleRate * 0.12);
        const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
        const src = a.createBufferSource(); src.buffer = buf;
        const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 3200;
        const g = a.createGain(); g.gain.value = 0.5;
        src.connect(f); f.connect(g); g.connect(a.destination); src.start(t);
        beep(180, 0.08, 0.15);
    }

    // ---------- Detectar la V de paz ----------
    const W = canvas.width, H = canvas.height;
    function isV(lm) {
        const d = (a, b) => Math.hypot((lm[a].x - lm[b].x) * W, (lm[a].y - lm[b].y) * H);
        const palm = d(0, 9);
        if (palm < 1) return false;
        const ratio = (tip, mcp) => d(tip, 0) / Math.max(1, d(mcp, 0));
        return ratio(8, 5) > 1.6 && ratio(12, 9) > 1.6          // índice y medio estirados
            && ratio(16, 13) < 1.35 && ratio(20, 17) < 1.35     // anular y meñique cerrados
            && d(8, 12) > 0.4 * palm;                           // y separados (forma de V)
    }

    // ---------- Estado ----------
    let counting = false, cdTimer = null, holdStart = 0, lastV = 0, cooldownUntil = 0;
    let lastBlob = null, lastURL = "", pvTimer = null;

    function galleryOpen() { const g = document.getElementById("gallery"); return !!g && g.classList.contains("open"); }
    function canShoot() {
        if (counting || performance.now() < cooldownUntil || document.hidden) return false;
        if (document.getElementById("ldr")) return false;                                  // pantalla de carga visible
        if (galleryOpen()) return false;                                                   // galería abierta
        return true;
    }

    // ---------- Cuenta regresiva ----------
    function showNum(n) {
        numEl.textContent = n;
        numEl.classList.remove("pop"); void numEl.offsetWidth; numEl.classList.add("pop");
        beep(880, 0.09, 0.08);
    }
    function startCountdown() {
        if (counting) return;
        counting = true; btn.disabled = true;
        hold.classList.remove("on"); holdStart = 0;
        closePreview();
        cd.classList.add("on");
        let n = COUNT_FROM;
        showNum(n);
        cdTimer = setInterval(() => {
            n--;
            if (n > 0) showNum(n);
            else { clearInterval(cdTimer); cdTimer = null; numEl.textContent = ""; takePhoto(); }
        }, 1000);
    }
    function cancelCountdown() {
        if (!counting) return;
        clearInterval(cdTimer); cdTimer = null;
        cd.classList.remove("on"); numEl.textContent = "";
        counting = false; btn.disabled = false;
    }

    // ---------- Armar la foto ----------
    const pad2 = (n) => String(n).padStart(2, "0");
    function currentPalette() {
        const key = [...document.body.classList].find((c) => PALETTE_OF[c]);
        return PALETTES[PALETTE_OF[key]] || PALETTES.aero;
    }
    function fitFont(g, text, maxW, size, weight, family) {
        let s = size;
        do { g.font = `${weight} ${s}px ${family}`; s -= 1; } while (g.measureText(text).width > maxW && s > 11);
    }
        // ---------- Marco de la foto: ventana del sistema, igual que el marco en pantalla ----------
    const UI_FONT = "Tahoma, Verdana, sans-serif";
    const XP_BTN = { w: 21, h: 21, r: 3, edge: "#fff", ink: "#fff", diag: true,
        norm: [[0, "#5b95ff"], [1, "#1a50d8"]], close: [[0, "#f0866b"], [1, "#c8381c"]] };
    const glassBtn = (edge, ink, norm, close, closeInk) => ({ w: 26, h: 18, r: [0, 0, 6, 6], edge, ink, norm, close, closeInk });
    const XP_TITLE = [[0, "#0997ff"], [0.1, "#0053ee"], [0.5, "#0050ee"], [0.88, "#0066ff"], [1, "#0050ee"]];
    const WIN = {
        xp:    { kind: "xp", bw: 4, tb: 30, base: "#0831d9", title: XP_TITLE, ink: "#fff", inkShadow: "#0f1089",
                 chrome: "#ece9d8", chromeInk: "#000", logo: "squares", btn: XP_BTN },
        error: { kind: "xp", bw: 4, tb: 30, base: "#7a0000", ink: "#fff", inkShadow: "#550000",
                 title: [[0, "#ff6a5a"], [0.12, "#d42a1a"], [0.5, "#c01c0e"], [0.9, "#e03a2a"], [1, "#b01208"]],
                 chrome: "#ece9d8", chromeInk: "#000", logo: "squares", btn: XP_BTN },
        aero:  { kind: "aero", bw: 8, tb: 30, ink: "#0b3556", chromeInk: "#0b3556", logo: "orb", orb: ["#fff", "#7fe0ff", "#1c8ad8"],
                 title: [[0, "rgba(255,255,255,.85)"], [0.5, "rgba(255,255,255,.85)"], [0.5, "rgba(255,255,255,.2)"], [1, "rgba(255,255,255,.2)"]],
                 btn: glassBtn("#3b6a94", "#123", [[0, "#e8f4ff"], [0.5, "#9cc7ea"], [0.5, "#6fa9d6"], [1, "#a6d3f2"]],
                               [[0, "#f5b3a8"], [0.5, "#e0533a"], [0.5, "#c4311a"], [1, "#ee7a62"]], "#fff") },
        media: { kind: "media", bw: 6, tb: 30, ink: "#dbe8ff", chromeInk: "#bcd2ff", logo: "orb", orb: ["#e6ffd0", "#5fd13a", "#1f6d10"],
                 title: [[0, "rgba(255,255,255,.28)"], [0.5, "rgba(255,255,255,.28)"], [0.5, "rgba(255,255,255,.04)"], [1, "rgba(255,255,255,.04)"]],
                 btn: glassBtn("#5f7fbf", "#dbe8ff", [[0, "#34508a"], [0.5, "#14234a"], [0.5, "#0b1430"], [1, "#22397a"]],
                               [[0, "#d86a5a"], [0.5, "#a02a1a"], [0.5, "#7d1608"], [1, "#c24a38"]], "#dbe8ff") },
        paint: { kind: "w98", bw: 5, tb: 22, ink: "#fff", chrome: "#c0c0c0", chromeInk: "#000", palette: true,
                 title: [[0, "#000080"], [1, "#1084d0"]], btn: { w: 16, h: 14, r: 0, bevel: true, ink: "#000" } },
        term:  { kind: "w98", bw: 5, tb: 22, ink: "#fff", chrome: "#c0c0c0", chromeInk: "#000", mono: true,
                 statusBg: "#000", statusInk: "#33ff66",
                 title: [[0, "#404040"], [1, "#808080"]], btn: { w: 16, h: 14, r: 0, bevel: true, ink: "#000" } },
    };
    const SWATCHES = ["#000", "#808080", "#800000", "#808000", "#008000", "#008080", "#000080", "#800080", "#808040", "#004040", "#0080ff", "#004080", "#8000ff", "#804000",
                      "#fff", "#c0c0c0", "#f00", "#ff0", "#0f0", "#0ff", "#00f", "#f0f", "#ffff80", "#00ff80", "#80ffff", "#8080ff", "#ff0080", "#ff8040"];

    function rr(g, x, y, w, h, r) {   // rectángulo redondeado; r = número o [sup-izq, sup-der, inf-der, inf-izq]
        const [a, b, c, d] = Array.isArray(r) ? r : [r, r, r, r];
        g.beginPath();
        g.moveTo(x + a, y);
        g.lineTo(x + w - b, y); g.arcTo(x + w, y, x + w, y + b, b);
        g.lineTo(x + w, y + h - c); g.arcTo(x + w, y + h, x + w - c, y + h, c);
        g.lineTo(x + d, y + h); g.arcTo(x, y + h, x, y + h - d, d);
        g.lineTo(x, y + a); g.arcTo(x, y, x + a, y, a);
        g.closePath();
    }
    function grad(g, x0, y0, x1, y1, stops) {
        const gr = g.createLinearGradient(x0, y0, x1, y1);
        stops.forEach(([p, c]) => gr.addColorStop(p, c));
        return gr;
    }
    function bevel(g, x, y, w, h, raised, t = 2) {   // borde en relieve (Windows 98)
        g.fillStyle = raised ? "#fff" : "#808080"; g.fillRect(x, y, w, t); g.fillRect(x, y, t, h);
        g.fillStyle = raised ? "#404040" : "#fff"; g.fillRect(x, y + h - t, w, t); g.fillRect(x + w - t, y, t, h);
    }
    function drawLogo(g, st, x, y) {   // 16x16
        if (st.logo === "squares") {
            [["#f25022", 0, 0], ["#7fba00", 9, 0], ["#00a4ef", 0, 9], ["#ffb900", 9, 9]].forEach(([c, dx, dy]) => { g.fillStyle = c; g.fillRect(x + dx, y + dy, 7, 7); });
        } else if (st.logo === "orb") {
            const r = g.createRadialGradient(x + 5, y + 5, 1, x + 8, y + 8, 9);
            r.addColorStop(0, st.orb[0]); r.addColorStop(0.5, st.orb[1]); r.addColorStop(1, st.orb[2]);
            g.fillStyle = r; g.beginPath(); g.arc(x + 8, y + 8, 8, 0, Math.PI * 2); g.fill();
        }
    }
    // los tres botones de la ventana: minimizar, maximizar (cuadrado) y cerrar (X)
    function drawButtons(g, st, wx, ty, tw) {
        const b = st.btn, gap = 2;
        const x0 = wx + tw - 4 - (b.w * 3 + gap * 2), y = ty + Math.round((st.tb - b.h) / 2);
        ["min", "max", "close"].forEach((k, i) => {
            const bx = x0 + i * (b.w + gap);
            rr(g, bx, y, b.w, b.h, b.r);
            if (b.bevel) { g.fillStyle = "#c0c0c0"; g.fill(); bevel(g, bx, y, b.w, b.h, true); }
            else {
                const stops = k === "close" ? b.close : b.norm;
                g.fillStyle = b.diag ? grad(g, bx, y, bx + b.w, y + b.h, stops) : grad(g, 0, y, 0, y + b.h, stops);
                g.fill(); g.strokeStyle = b.edge; g.lineWidth = 1; g.stroke();
            }
            g.strokeStyle = (k === "close" && b.closeInk) ? b.closeInk : b.ink;
            g.lineWidth = b.bevel ? 1.5 : 2; g.lineCap = "butt";
            const cx = bx + b.w / 2, cy = y + b.h / 2, s = Math.min(b.w, b.h) * 0.22;
            g.beginPath();
            if (k === "min") { g.moveTo(cx - s * 1.1, cy + s * 1.4); g.lineTo(cx + s * 1.1, cy + s * 1.4); }
            else if (k === "max") { g.rect(cx - s * 1.1, cy - s * 1.1, s * 2.2, s * 2.2); }
            else { g.moveTo(cx - s, cy - s); g.lineTo(cx + s, cy + s); g.moveTo(cx + s, cy - s); g.lineTo(cx - s, cy + s); }
            g.stroke();
        });
        return b.w * 3 + gap * 2 + 4;
    }

    function compose(withStickers = true) {
        const fc = document.getElementById("frame");
        const key = ["xp", "error", "aero", "media", "paint", "term"].find((k) => fc && fc.classList.contains("f-" + k)) || "aero";
        const st = WIN[key], pal = currentPalette();
        const items = [...document.querySelectorAll("#menubar span")].map((s) => s.textContent);
        const inset = st.kind === "w98" ? st.bw : 0;            // en Paint/consola la barra va dentro del borde
        const MB = items.length ? 22 : 0, PB = st.palette ? 26 : 0, SB = 24, M = 90;
        const Ww = W + st.bw * 2, Wh = inset + st.tb + MB + H + PB + SB + st.bw;
        const CW = Ww + M * 2, CH = Wh + M * 2, wx = M, wy = M;
        const out = document.createElement("canvas");
        out.width = CW; out.height = CH;
        const g = out.getContext("2d");
        const family = (st.mono ? "'Courier New', monospace" : UI_FONT);

        // fondo con los colores del tema
        g.fillStyle = grad(g, 0, 0, CW * 0.4, CH, [[0, pal.bg[0]], [1, pal.bg[1]]]);
        g.fillRect(0, 0, CW, CH);
        if (pal.gloss) { g.fillStyle = grad(g, 0, 0, 0, CH * 0.5, [[0, "rgba(255,255,255,.3)"], [1, "rgba(255,255,255,0)"]]); g.fillRect(0, 0, CW, CH * 0.5); }

        // cuerpo de la ventana
        g.save();
        g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = 26; g.shadowOffsetY = 10;
        if (st.kind === "aero") { rr(g, wx, wy, Ww, Wh, 14); g.fillStyle = grad(g, 0, wy, 0, wy + Wh, [[0, "rgba(255,255,255,.78)"], [1, "rgba(150,220,255,.72)"]]); }
        else if (st.kind === "media") { rr(g, wx, wy, Ww, Wh, 10); g.fillStyle = grad(g, 0, wy, 0, wy + Wh, [[0, "#1b2a4a"], [1, "#070d1c"]]); }
        else if (st.kind === "w98") { g.beginPath(); g.rect(wx, wy, Ww, Wh); g.fillStyle = "#c0c0c0"; }
        else { rr(g, wx, wy, Ww, Wh, [9, 9, 2, 2]); g.fillStyle = st.base; }
        g.fill(); g.restore();
        if (st.kind === "aero") { rr(g, wx + 0.5, wy + 0.5, Ww - 1, Wh - 1, 14); g.strokeStyle = "rgba(255,255,255,.95)"; g.lineWidth = 1.5; g.stroke(); }
        else if (st.kind === "media") { rr(g, wx + 0.5, wy + 0.5, Ww - 1, Wh - 1, 10); g.strokeStyle = "#5f7fbf"; g.lineWidth = 1; g.stroke(); }
        else if (st.kind === "w98") bevel(g, wx, wy, Ww, Wh, true);

        // barra de título
        const tx = wx + inset, ty = wy + inset, tw = Ww - inset * 2;
        const trad = st.kind === "w98" ? 0 : st.kind === "aero" ? [13, 13, 0, 0] : st.kind === "media" ? [9, 9, 0, 0] : [8, 8, 0, 0];
        rr(g, tx, ty, tw, st.tb, trad);
        g.fillStyle = st.kind === "w98" ? grad(g, tx, 0, tx + tw, 0, st.title) : grad(g, 0, ty, 0, ty + st.tb, st.title);
        g.fill();
        const hasLogo = !!st.logo;
        if (hasLogo) drawLogo(g, st, tx + 9, ty + (st.tb - 16) / 2);
        const btnW = drawButtons(g, st, tx, ty, tw);
        const titleEl = document.getElementById("title");
        const title = (titleEl && titleEl.textContent.trim()) || BRAND;
        const textX = tx + (hasLogo ? 9 + 16 + 6 : 8);
        fitFont(g, title, tw - (textX - tx) - btnW - 8, st.kind === "w98" ? 13 : 14, "bold", family);
        g.textAlign = "left"; g.textBaseline = "middle";
        const midY = ty + st.tb / 2 + 1;
        if (st.inkShadow) { g.fillStyle = st.inkShadow; g.fillText(title, textX + 1, midY + 1); }
        if (st.kind === "aero" || st.kind === "media") { g.shadowColor = st.kind === "aero" ? "#fff" : "#3d7bff"; g.shadowBlur = 7; }
        g.fillStyle = st.ink; g.fillText(title, textX, midY);
        g.shadowBlur = 0;

        // barra de menú (si el tema la tiene)
        const cx0 = wx + st.bw, cy0 = ty + st.tb + MB;
        if (MB) {
            if (st.chrome) { g.fillStyle = st.chrome; g.fillRect(cx0, ty + st.tb, W, MB); }
            g.font = `13px ${family}`; g.fillStyle = st.chromeInk; g.textBaseline = "middle";
            let mx = cx0 + 8;
            items.forEach((t) => { g.fillText(t, mx, ty + st.tb + MB / 2); mx += g.measureText(t).width + 14; });
        }

        // la foto, espejada para que quede igual a como la ves en pantalla
        g.save(); g.translate(cx0 + W, cy0); g.scale(-1, 1); g.drawImage(canvas, 0, 0, W, H); g.restore();
        if (st.kind === "aero") { g.strokeStyle = "rgba(0,60,120,.6)"; g.lineWidth = 1; g.strokeRect(cx0 - 0.5, cy0 - 0.5, W + 1, H + 1); }
        else if (st.kind === "media") { g.strokeStyle = "#5f7fbf"; g.lineWidth = 1; g.strokeRect(cx0 - 0.5, cy0 - 0.5, W + 1, H + 1); }
        else if (st.kind === "w98") bevel(g, cx0 - 2, cy0 - 2, W + 4, H + 4, false);

        // fecha de cámara digital
        const now = new Date();
        if (DATE_STAMP) {
            const stamp = `'${pad2(now.getFullYear() % 100)} ${pad2(now.getMonth() + 1)} ${pad2(now.getDate())}`;
            g.font = "bold 24px 'Courier New', monospace"; g.textAlign = "right"; g.textBaseline = "alphabetic";
            g.fillStyle = "rgba(0,0,0,.45)"; g.fillText(stamp, cx0 + W - 14 + 2, cy0 + H - 14 + 2);
            g.fillStyle = "#ff9a2e"; g.fillText(stamp, cx0 + W - 14, cy0 + H - 14);
        }

        // paleta de colores (Paint)
        if (PB) {
            g.fillStyle = "#c0c0c0"; g.fillRect(cx0, cy0 + H, W, PB);
            SWATCHES.forEach((c, i) => { const sx = cx0 + 6 + i * 17; g.fillStyle = c; g.fillRect(sx, cy0 + H + 5, 16, 16); bevel(g, sx, cy0 + H + 5, 16, 16, false, 1); });
        }

        // barra de estado: crédito y fecha
        const sy = cy0 + H + PB;
        if (st.kind === "xp") { g.fillStyle = st.chrome; g.fillRect(cx0, sy, W, SB); g.fillStyle = "#aca899"; g.fillRect(cx0, sy, W, 1); }
        else if (st.kind === "w98") { g.fillStyle = st.statusBg || "#c0c0c0"; g.fillRect(cx0, sy, W, SB); }
        const when = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
        g.font = `12px ${family}`; g.textAlign = "left"; g.textBaseline = "middle";
        g.fillStyle = st.statusInk || st.chromeInk;
        g.fillText(`${CREDIT || BRAND} · ${when}`, cx0 + 8, sy + SB / 2);

        // stickers: los mismos que se ven en pantalla, en el mismo lugar relativo
        if (withStickers) {
            document.querySelectorAll("#stickers .sticker").forEach((el) => {
                if (parseFloat(el.style.opacity) < 0.5) return;
                const img = el.querySelector("img");
                if (!img || !img.complete || !img.naturalWidth) return;
                const rot = parseFloat((/rotate\((-?[\d.]+)deg\)/.exec(el.style.transform) || [0, 0])[1]) * Math.PI / 180;
                const sc = parseFloat((/scale\(([\d.]+)\)/.exec(el.style.transform) || [0, 1])[1]);
                const w = parseFloat(el.style.width) * sc, h = w * img.naturalHeight / img.naturalWidth;
                const px = Math.min(CW - w * 0.3, Math.max(w * 0.3, parseFloat(el.style.left) / 100 * CW));
                const py = Math.min(CH - h * 0.3, Math.max(h * 0.3, parseFloat(el.style.top) / 100 * CH));
                g.save();
                g.translate(px, py); g.rotate(rot);
                g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 10; g.shadowOffsetY = 6;
                g.imageSmoothingEnabled = !img.classList.contains("px");
                g.drawImage(img, -w / 2, -h / 2, w, h);
                g.restore();
            });
        }
        return out;
    }

    function takePhoto() {
        // flash + sonido
        flashEl.classList.remove("go"); void flashEl.offsetWidth; flashEl.classList.add("go");
        shutter();
        cd.classList.remove("on");
        const done = (blob) => {
            if (blob) { setLast(blob); if (AUTO_DOWNLOAD) save(); else showPreview(); }
            finish();
        };
        try { compose(true).toBlob(done, "image/png"); }
        catch (e) {
            // si el navegador bloquea el canvas por las imágenes (abierto con doble clic), se guarda sin stickers
            console.warn("Foto sin stickers: abrí la página con un servidor local para incluirlos.", e);
            try { compose(false).toBlob(done, "image/png"); }
            catch (e2) { console.error("No se pudo armar la foto", e2); finish(); }
        }
    }
    function finish() {
        counting = false; btn.disabled = false;
        cooldownUntil = performance.now() + COOLDOWN_MS;
    }

    // ---------- Guardar / compartir / vista previa ----------
    function fileName() {
        const n = new Date();
        return `y2k-cam-${n.getFullYear()}${pad2(n.getMonth() + 1)}${pad2(n.getDate())}-${pad2(n.getHours())}${pad2(n.getMinutes())}${pad2(n.getSeconds())}.png`;
    }
    function setLast(blob) {
        if (lastURL) { try { URL.revokeObjectURL(lastURL); } catch (e) {} }
        lastBlob = blob;
        try { lastURL = URL.createObjectURL(blob); } catch (e) { lastURL = ""; }
    }
    function save() {
        if (!lastBlob || !lastURL) return;
        const a = document.createElement("a");
        a.href = lastURL; a.download = fileName();
        document.body.appendChild(a); a.click(); a.remove();
    }
    async function share() {
        if (!lastBlob) return;
        try {
            const file = new File([lastBlob], fileName(), { type: "image/png" });
            if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: BRAND });
            else save();
        } catch (e) { /* la persona canceló el menú de compartir */ }
    }

    const pv = document.createElement("div");
    pv.id = "pv";
    pv.innerHTML = '<img alt="Tu foto"><div class="ac"><button type="button" class="sv">💾 Guardar</button><button type="button" class="x" title="Cerrar">✕</button></div>';
    document.body.appendChild(pv);
    const pvImg = pv.querySelector("img");
    pv.querySelector(".sv").addEventListener("click", save);
    pv.querySelector(".x").addEventListener("click", () => closePreview());
    pvImg.addEventListener("click", save);
    pvImg.style.cursor = "pointer";
    pvImg.title = "Clic para guardar";

    function showPreview() {
        if (!lastURL) return;
        pvImg.src = lastURL;
        pv.classList.add("on");
        clearTimeout(pvTimer);
        pvTimer = setTimeout(() => closePreview(), PREVIEW_MS);
    }
    function closePreview() { clearTimeout(pvTimer); pv.classList.remove("on"); }
    pv.addEventListener("mouseenter", () => clearTimeout(pvTimer));

    // ---------- Disparadores ----------
    btn.addEventListener("click", () => { if (canShoot()) startCountdown(); });
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { cancelCountdown(); closePreview(); }
        else if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey && canShoot()) startCountdown();
    });

    // gesto: la V mantenida (se tolera algún cuadro suelto donde no se detecta)
    function tick() {
        requestAnimationFrame(tick);
        const now = performance.now();
        const hs = window.__hands, ht = window.__handsT;
        if (hs && ht && now - ht < 300 && canShoot() && hs.some(isV)) lastV = now;
        const holding = lastV && now - lastV < 250 && canShoot();
        if (counting && galleryOpen()) cancelCountdown();   // si se abre la galería a mitad de cuenta, se cancela

        // FILTRO CONGELADO: desde que aparece la V y durante toda la cuenta regresiva.
        // index.html lee esta bandera y deja de seguir la altura/inclinación de la mano.
        const freeze = counting || !!holding;
        if (freeze !== !!window.__freezeFilter) window.__freezeFilter = freeze;
        if (holding) {
            if (!holdStart) holdStart = now;
            const p = Math.min(1, (lastV - holdStart) / HOLD_MS);   // cuenta solo el tiempo con la V realmente puesta
            hold.classList.add("on");
            holdFill.style.width = (p * 100).toFixed(0) + "%";
            if (p >= 1) { holdStart = 0; lastV = 0; startCountdown(); }
        } else {
            holdStart = 0;
            hold.classList.remove("on");
        }
    }
    requestAnimationFrame(tick);
})();
