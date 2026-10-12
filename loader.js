/* ============================================================
   Pantalla de carga estilo instalador Y2K.
   Es autónoma: inyecta su propio CSS y HTML, y avanza según
   lo que pasa de verdad en la página:
     - descarga del motor y del modelo de manos (PerformanceObserver)
     - texto de #info ("¡Listo!" / "Error ...")
     - primer cuadro de cámara (#info se oculta)
   Uso: <script src="loader.js"></script> justo después de <body>.
   ============================================================ */
(function () {
    "use strict";

    // ---------- Ajustes rápidos ----------
    const TITLE = "Filtros con Gestos";
    const REQUIRE_CLICK = true;    // true: botón "Entrar" (además sirve para activar la música). false: entra sola.
    const MIN_SHOW_MS = 1800;      // tiempo mínimo en pantalla, para que no parpadee si carga muy rápido
    const SLOW_HINT_MS = 20000;    // a los 20 s avisa que está tardando
    const RETRY_MS = 40000;        // a los 40 s ofrece reintentar

    const TIPS = [
        "Tip: cerrá el puño para cambiar de filtro",
        "Tip: subí o bajá la mano para cambiar la intensidad",
        "Tip: abrí las dos manos para ver la galería de filtros",
        "Tip: en la galería, pellizcá con pulgar e índice para elegir",
        "Podes descargar tus fotos",
    ];

    // ---------- CSS ----------
    const css = `
#ldr { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; overflow: hidden;
    font-family: Tahoma, Verdana, sans-serif; color: #0b3556; padding: 16px; box-sizing: border-box;
    background: radial-gradient(circle at 18% 14%, rgba(255,255,255,.95) 0, rgba(255,255,255,0) 34%),
                radial-gradient(circle at 85% 85%, rgba(255,255,255,.5) 0, rgba(255,255,255,0) 42%),
                linear-gradient(160deg, #6fd0ff, #2a7bd6 60%, #1b4fb3);
    transition: opacity .6s ease, transform .6s ease; }
#ldr.out { opacity: 0; transform: scale(1.04); pointer-events: none; }
#ldr .bk { position: absolute; border-radius: 50%; pointer-events: none;
    background: radial-gradient(circle at 32% 28%, rgba(255,255,255,.95), rgba(255,255,255,.25) 40%, rgba(255,255,255,.06) 70%);
    border: 1px solid rgba(255,255,255,.7); animation: ldrFloat var(--d, 9s) ease-in-out infinite alternate; }
@keyframes ldrFloat { from { transform: translateY(0) scale(1); } to { transform: translateY(-26px) scale(1.06); } }

#ldr .win { position: relative; width: min(440px, 100%); border-radius: 12px; border: 1px solid rgba(255,255,255,.95);
    background: linear-gradient(180deg, rgba(255,255,255,.82), rgba(185,228,255,.68));
    box-shadow: 0 14px 40px rgba(0,40,110,.5), inset 0 0 18px rgba(255,255,255,.8); }
#ldr .tb { display: flex; align-items: center; gap: 7px; height: 28px; padding: 0 7px 0 9px; border-radius: 11px 11px 0 0;
    font-weight: bold; font-size: 12px; text-shadow: 0 0 6px #fff;
    background: linear-gradient(180deg, rgba(255,255,255,.85) 0 50%, rgba(255,255,255,.2) 50% 100%); }
#ldr .tb .ti { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#ldr .tb .dot { width: 12px; height: 12px; border-radius: 50%; flex: none; background: radial-gradient(circle at 35% 30%, #fff, #7fe0ff 45%, #1c8ad8); }
#ldr .tb i { width: 20px; height: 15px; border-radius: 0 0 5px 5px; border: 1px solid #3b6a94; font-style: normal; font-size: 9px; display: grid; place-items: center;
    background: linear-gradient(#e8f4ff, #9cc7ea 50%, #6fa9d6 50%, #a6d3f2); }
#ldr .tb i:last-child { color: #fff; border-color: #8a2a1a; background: linear-gradient(#f5b3a8, #e0533a 50%, #c4311a 50%, #ee7a62); }

#ldr .bd { padding: 20px 22px 18px; }
#ldr .row { display: flex; align-items: center; gap: 16px; }
#ldr .orb { position: relative; width: 58px; height: 58px; flex: none; border-radius: 50%;
    background: radial-gradient(circle at 35% 28%, #fff, #7fe0ff 42%, #1c8ad8 80%); box-shadow: 0 0 16px rgba(80,200,255,.8), inset 0 -4px 8px rgba(0,60,140,.35);
    display: grid; place-items: center; font-size: 26px; color: #fff; text-shadow: 0 1px 3px rgba(0,60,140,.6); }
#ldr .orb::after { content: ""; position: absolute; inset: -6px; border-radius: 50%; border: 3px solid transparent;
    border-top-color: #fff; border-right-color: rgba(255,255,255,.5); animation: ldrSpin 1s linear infinite; }
#ldr.done .orb::after, #ldr.err .orb::after { animation: none; border-color: transparent; }
#ldr.err .orb { background: radial-gradient(circle at 35% 28%, #fff, #ff9a8a 42%, #d02a14 80%); box-shadow: 0 0 16px rgba(255,90,70,.7), inset 0 -4px 8px rgba(120,0,0,.35); }
@keyframes ldrSpin { to { transform: rotate(360deg); } }
#ldr h1 { margin: 0 0 4px; font-size: 18px; letter-spacing: .3px; text-shadow: 0 0 8px #fff; }
#ldr .st { margin: 0; font-size: 13px; min-height: 17px; }

#ldr .barw { display: flex; align-items: center; gap: 10px; margin-top: 18px; }
#ldr .bar { position: relative; flex: 1; height: 22px; border-radius: 6px; padding: 2px; box-sizing: border-box; overflow: hidden;
    background: linear-gradient(180deg, #cfe4f5, #fff); border: 1px solid #5a86ad; box-shadow: inset 0 2px 4px rgba(0,60,120,.3); }
#ldr .fill { position: relative; height: 100%; width: 0%; border-radius: 3px;
    background: repeating-linear-gradient(90deg, #36c6ff 0 11px, transparent 11px 14px); }
#ldr .fill::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,.65), rgba(255,255,255,0) 55%); }
#ldr .pc { width: 42px; text-align: right; font-weight: bold; font-size: 13px; }
#ldr.err .barw { display: none; }

#ldr .tip { margin: 14px 0 0; min-height: 30px; font-size: 12px; font-style: italic; text-align: center; opacity: .85; transition: opacity .3s; }
#ldr .acts { display: flex; justify-content: center; gap: 10px; margin-top: 4px; min-height: 40px; }
#ldr button { display: none; padding: 8px 22px; border-radius: 18px; cursor: pointer; font: bold 14px Tahoma, Verdana, sans-serif; color: #0b3556; text-shadow: 0 0 4px #fff;
    border: 1px solid rgba(255,255,255,.95); box-shadow: 0 4px 14px rgba(0,60,120,.4), inset 0 0 8px rgba(255,255,255,.8);
    background: linear-gradient(180deg, rgba(255,255,255,.9) 0 50%, rgba(150,220,255,.75) 50% 100%); }
#ldr button:hover { filter: brightness(1.06); }
#ldr button.show { display: inline-block; }
#ldr button#ldrGo.show { animation: ldrPulse 1.4s ease-in-out infinite; }
@keyframes ldrPulse { 50% { transform: scale(1.06); box-shadow: 0 4px 22px rgba(80,200,255,.9), inset 0 0 8px rgba(255,255,255,.8); } }
#ldr .cr { position: absolute; bottom: 10px; left: 0; right: 0; text-align: center; font-size: 11px; color: #fff; text-shadow: 0 1px 3px rgba(0,40,100,.7); opacity: .8; }

@media (max-width: 480px) { #ldr .bd { padding: 16px 14px 14px; } #ldr h1 { font-size: 15px; } #ldr .orb { width: 46px; height: 46px; font-size: 20px; } }
@media (prefers-reduced-motion: reduce) { #ldr .bk, #ldr .orb::after, #ldr button#ldrGo.show { animation: none; } #ldr { transition: opacity .2s; } }
`;
    const styleEl = document.createElement("style");
    styleEl.textContent = css;
    document.documentElement.appendChild(styleEl);

    // ---------- HTML ----------
    const root = document.createElement("div");
    root.id = "ldr";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", "Cargando");
    root.innerHTML =
        '<div class="win">' +
            '<div class="tb"><span class="dot"></span><span class="ti"></span><i>_</i><i>✕</i></div>' +
            '<div class="bd">' +
                '<div class="row"><div class="orb">✦</div>' +
                    '<div><h1>Preparando la app…</h1><p class="st" role="status" aria-live="polite">Iniciando…</p></div></div>' +
                '<div class="barw"><div class="bar"><div class="fill"></div></div><div class="pc">0%</div></div>' +
                '<p class="tip"></p>' +
                '<div class="acts"><button id="ldrGo" type="button">▶ Entrar</button><button id="ldrRetry" type="button">↻ Reintentar</button></div>' +
            '</div>' +
        '</div>';
    // burbujas de fondo
    for (let i = 0; i < 9; i++) {
        const b = document.createElement("span");
        const s = 40 + Math.random() * 120;
        b.className = "bk";
        b.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;--d:${(7 + Math.random() * 8).toFixed(1)}s;opacity:${(0.35 + Math.random() * 0.5).toFixed(2)}`;
        root.appendChild(b);
    }
    document.documentElement.appendChild(root);

    const $ = (sel) => root.querySelector(sel);
    $(".ti").textContent = TITLE + " — Instalando";
    const elFill = $(".fill"), elPc = $(".pc"), elSt = $(".st"), elH1 = $("h1"), elTip = $(".tip"), elOrb = $(".orb");
    const btnGo = $("#ldrGo"), btnRetry = $("#ldrRetry");
    btnRetry.addEventListener("click", () => location.reload());

    // ---------- Seguimiento de la carga ----------
    const t0 = performance.now();
    const flags = { bundle: false, wasm: false, model: false, ready: false, frame: false };
    let failed = false, finished = false, shown = 0, lastChange = t0, goal = 4;

    function note(e) {
        const n = e.name || "";
        if (n.includes("hand_landmarker") || /\.task(\?|$)/.test(n)) flags.model = true;
        else if (n.includes("/wasm/") || /\.wasm(\?|$)/.test(n)) { if (/\.wasm(\?|$)/.test(n)) flags.wasm = true; }
        else if (n.includes("tasks-vision")) flags.bundle = true;
    }
    try {
        new PerformanceObserver((list) => list.getEntries().forEach(note)).observe({ type: "resource", buffered: true });
    } catch (e) { /* navegador sin PerformanceObserver: la barra avanza solo con los hitos finales */ }

    function poll() {
        const info = document.getElementById("info");
        if (!info) return;
        const text = info.textContent || "";
        if (/^Error/.test(text)) { fail(text); return; }
        if (/^¡Listo/.test(text) || info.style.display === "none") flags.ready = true;
        if (info.style.display === "none") flags.frame = true;
        if (flags.ready) { flags.bundle = flags.wasm = flags.model = true; }   // si el modelo está listo, todo lo anterior ya se descargó
    }

    function fail(text) {
        if (failed) return;
        failed = true;
        root.classList.add("err");
        elOrb.textContent = "!";
        elH1.textContent = "Ups, algo falló";
        const cam = /cámara|camara/i.test(text);
        elSt.textContent = cam
            ? "No pudimos acceder a tu cámara. Tocá el candado 🔒 de la barra de direcciones, permití la cámara y reintentá."
            : "No se pudo cargar la inteligencia artificial. Revisá tu conexión e intentá de nuevo.";
        elTip.textContent = "";
        btnGo.classList.remove("show");
        btnRetry.classList.add("show");
    }

    function phaseText() {
        if (flags.frame) return "¡Todo listo!";
        if (flags.ready) return "Esperando permiso de cámara…";
        if (!flags.bundle) return "Preparando la estética…";
        if (!flags.wasm) return "Preparando el motor de visión…";
        return "Descargando el modelo de manos…";
    }

    function enter() {
        if (finished) return;
        finished = true;
        root.classList.add("out");
        setTimeout(() => root.remove(), 700);
        clearInterval(pollTimer); clearInterval(tipTimer);
    }
    btnGo.addEventListener("click", enter);

    // progreso mostrado: sigue a una meta que sube con cada hito real y avanza despacito entre hito e hito
    let prevBase = -1;
    function frame() {
        if (finished) return;
        const now = performance.now();
        if (!failed) {
            const base = flags.frame ? 100
                : flags.ready ? 88
                : 4 + (flags.bundle ? 22 : 0) + (flags.wasm ? 24 : 0) + (flags.model ? 28 : 0);
            if (base !== prevBase) { prevBase = base; lastChange = now; }
            const cap = flags.frame ? 100 : flags.ready ? 97 : base + 18;
            const creep = flags.frame ? 0 : (cap - base) * 0.6 * (1 - Math.exp(-(now - lastChange) / 5000));
            goal = Math.min(cap, base + creep);
            shown += (goal - shown) * 0.07;
            if (flags.frame && 100 - shown < 0.4) shown = 100;
            elFill.style.width = shown.toFixed(1) + "%";
            elPc.textContent = Math.floor(shown) + "%";

            const slow = now - t0 > SLOW_HINT_MS && !flags.ready;
            elSt.textContent = phaseText();
            if (now - t0 > RETRY_MS && !flags.ready) btnRetry.classList.add("show");

            const complete = shown >= 100 && now - t0 >= MIN_SHOW_MS;
            if (complete) {
                root.classList.add("done");
                elOrb.textContent = "✓";
                elH1.textContent = "¡Listo!";
                if (REQUIRE_CLICK) { btnGo.classList.add("show"); }
                else { enter(); return; }
            }
            if (slow) elTip.textContent = "Está tardando más de lo normal… revisá tu conexión.";
        }
        requestAnimationFrame(frame);
    }

    let tipIdx = 0;
    function nextTip() {
        if (failed || finished || (performance.now() - t0 > SLOW_HINT_MS && !flags.ready)) return;
        elTip.style.opacity = 0;
        setTimeout(() => { elTip.textContent = TIPS[tipIdx++ % TIPS.length]; elTip.style.opacity = .85; }, 250);
    }
    elTip.textContent = TIPS[tipIdx++ % TIPS.length];

    const pollTimer = setInterval(poll, 100);
    const tipTimer = setInterval(nextTip, 3600);
    poll();
    requestAnimationFrame(frame);
})();
