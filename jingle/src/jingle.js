// Jingle « À LA DÉCOUVERTE » — animation déterministe : render(t) dessine l'image à l'instant t.
// Le rendu vidéo (render.js) appelle render(t) image par image ; rien ne dépend de l'horloge réelle.
(function () {
  "use strict";

  const Q = new URLSearchParams(location.search);
  const FORMAT = Q.get("format") === "v" ? "v" : "h";
  const W = FORMAT === "v" ? 1080 : 1920;
  const H = FORMAT === "v" ? 1920 : 1080;
  const M = Math.min(W, H);
  const CUE = window.CUES;
  const MED = window.MEDAILLON;
  const TILT = -7;
  const COL = {
    blue: "#2026E8",
    white: "#FFFFFF",
    purple: "#7027A5",
    crimson: "#B51235",
    emerald: "#0B5C50",
    gold: "#E8C77A",
  };

  // ---------- outils ----------
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, x) => a + (b - a) * x;
  const E = {
    lin: (x) => x,
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inCubic: (x) => x * x * x,
    inQuad: (x) => x * x,
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    inOutQuart: (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2),
    outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    outBack: (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2),
  };
  const tw = (t, a, b, from, to, ease = E.lin) => lerp(from, to, ease(prog(t, a, b)));
  const rad = (d) => (d * Math.PI) / 180;

  function el(tag, cls, parent, css) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (css) Object.assign(e.style, css);
    if (parent) parent.appendChild(e);
    return e;
  }
  const show = (e, on) => (e.style.display = on ? "" : "none");

  // ---------- scène ----------
  const stage = document.getElementById("stage");
  Object.assign(stage.style, { width: W + "px", height: H + "px" });
  el("div", "layer", stage).id = "bg";
  const bandsBack = el("div", "layer", stage);
  const worldWrap = el("div", "layer", stage);
  const world = el("div", "", worldWrap);
  world.id = "world";
  const vignette = el("div", "layer", stage);
  vignette.id = "vignette";
  const medLayer = el("div", "layer", stage);
  const titleLayer = el("div", "layer", stage);
  const bandsFront = el("div", "layer", stage);
  const flash = el("div", "layer", stage);
  flash.id = "flash";
  const flashDot = el("div", "", stage);
  flashDot.id = "flashdot";

  function band(parent, color, len, thick) {
    return el("div", "band", parent, { width: len + "px", height: thick + "px", background: color });
  }
  function placeBand(b, cx, cy, rot, len, thick) {
    b.style.transform = `translate(${cx - len / 2}px, ${cy - thick / 2}px) rotate(${rot}deg)`;
  }

  // Étiquette (mot) avec cadre blanc qui se dessine et texte révélé par masque
  function makeLabel(parent, text, size, opts = {}) {
    const root = el("div", "label" + (opts.cadre ? " cadre" : "") + (opts.invert ? " invert" : ""), parent);
    root.style.fontSize = size + "px";
    root.style.setProperty("--bw", Math.round(size * 0.075) + "px");
    const mask = el("div", "mask", root);
    const txt = el("span", "txt", mask);
    txt.textContent = text;
    const bars = opts.cadre ? ["t", "r", "b", "l"].map((s) => el("div", "bar bar-" + s, root)) : [];
    return { root, mask, txt, bars, size, x: 0, y: 0, r: 0, w: 0, h: 0 };
  }
  function drawBars(bars, t, a, b) {
    const q = (b - a) / 4;
    bars.forEach((bar, i) => {
      const p = E.outCubic(prog(t, a + i * q, a + (i + 1) * q));
      bar.style.transform = i % 2 === 0 ? `scaleX(${p})` : `scaleY(${p})`;
    });
  }
  function revealText(L, t, a, b) {
    const p = E.outExpo(prog(t, a, b));
    L.txt.style.transform = `translateY(${(1 - p) * 115}%)`;
  }
  function placeLabel(L) {
    L.root.style.transform = `translate(${L.x}px, ${L.y}px) rotate(${L.r}deg) translate(-50%, -50%)`;
  }

  // Mots du parcours caméra (coordonnées « monde »)
  const W1 = makeLabel(world, "DÉCOUVRIR", 300);
  const W2 = makeLabel(world, "CHANTRES", 170, { cadre: true });
  const W3 = makeLabel(world, "TALENTS", 230, { cadre: true });
  const W4 = makeLabel(world, "HISTOIRES", 190, { cadre: true });
  const w1Crimson = el("div", "band", W1.root, {
    left: "6%", width: "68%", top: "calc(100% - 0.03em)", height: "0.085em", background: COL.crimson, transformOrigin: "0 50%",
  });
  const w1White = el("div", "band", W1.root, {
    left: "auto", right: "4%", width: "42%", top: "0.02em", height: "0.045em", background: COL.white, transformOrigin: "100% 50%",
  });
  const w3Purple = el("div", "band", W3.root, {
    left: "38%", width: "95%", top: "78%", height: "0.2em", background: COL.purple, zIndex: -1, transformOrigin: "0 50%",
  });
  const w2White = el("div", "band", W2.root, {
    left: "-30%", width: "40%", top: "60%", height: "0.06em", background: COL.white, zIndex: -1, transformOrigin: "100% 50%",
  });

  // Bandes plein écran
  const L_OPEN = Math.hypot(W, H) * 1.6;
  const openBand = band(bandsFront, COL.white, L_OPEN, M * 0.2);
  const histPurple = band(bandsBack, COL.purple, W * 1.6, M * 0.065);
  const histCrimson = band(bandsBack, COL.crimson, W * 1.6, M * 0.042);
  const histWhite = band(bandsBack, COL.white, W * 1.2, M * 0.012);

  // ---------- médaillon ----------
  const D = FORMAT === "v" ? W * 0.9 : H * 0.8;
  const med = el("div", "", medLayer, { width: D + "px", height: D + "px" });
  med.id = "med";
  const medGlow = el("div", "glow", med, {
    boxShadow: `0 0 ${D * 0.09}px ${D * 0.01}px rgba(255, 206, 120, 0.42), 0 ${D * 0.02}px ${D * 0.07}px rgba(0, 0, 40, 0.35)`,
  });
  const medClip = el("div", "clip", med);
  const medImg = el("img", "", medClip);
  medImg.src = "../assets/medaillon.png";
  const haloSize = D * 0.78;
  const halo = el("div", "halo", medClip, {
    width: haloSize + "px",
    height: haloSize + "px",
    left: MED.halo.x * D - haloSize / 2 + "px",
    top: MED.halo.y * D - haloSize / 2 + "px",
    background:
      "radial-gradient(circle, rgba(255,232,170,0.9) 0%, rgba(255,214,130,0.4) 32%, rgba(255,200,100,0) 68%)",
  });
  const glints = MED.glints.map((g, i) => {
    const gw = D * (0.026 + 0.012 * ((i * 37) % 5) / 4);
    const gh = gw * 0.3;
    const e = el("div", "glint", medClip, {
      width: gw + "px",
      height: gh + "px",
      background: "radial-gradient(ellipse, rgba(255,255,255,0.95) 0%, rgba(220,240,255,0.5) 40%, rgba(255,255,255,0) 72%)",
    });
    return { e, x: g.x * D - gw / 2, y: g.y * D - gh / 2, phase: (i * 0.618) % 1, freq: 1.1 + ((i * 7) % 5) * 0.18 };
  });
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${D} ${D}`);
  svg.setAttribute("width", D);
  svg.setAttribute("height", D);
  med.appendChild(svg);
  function ring(r, width, color) {
    const c = document.createElementNS(svgNS, "circle");
    c.setAttribute("cx", D / 2);
    c.setAttribute("cy", D / 2);
    c.setAttribute("r", r);
    c.setAttribute("fill", "none");
    c.setAttribute("stroke", color);
    c.setAttribute("stroke-width", width);
    c.setAttribute("transform", `rotate(-90 ${D / 2} ${D / 2})`);
    const len = 2 * Math.PI * r;
    c.setAttribute("stroke-dasharray", len);
    svg.appendChild(c);
    return { c, len };
  }
  const ringMain = ring(((MED.ringOuter + MED.ringInner) / 2) * D, (MED.ringOuter - MED.ringInner) * D, COL.emerald);
  const ringGold = ring(MED.ringInner * D, D * 0.006, COL.gold);

  // ---------- bloc-titre ----------
  const lockup = el("div", "", titleLayer);
  lockup.id = "lockup";
  const plate = el("div", "plate", lockup);
  const box = el("div", "box", lockup);
  const word = el("div", "word", box);
  const sDecouv = el("span", "", word);
  sDecouv.textContent = "DÉCOUV";
  const rir = el("span", "", word);
  const rirLetters = "RIR".split("").map((ch) => {
    const s = el("span", "", rir);
    s.textContent = ch;
    return s;
  });
  const erteMask = el("div", "erte", word);
  const erteLetters = "ERTE".split("").map((ch) => {
    const s = el("span", "", erteMask);
    s.textContent = ch;
    return s;
  });
  const boxBars = ["t", "r", "b", "l"].map((s) => el("div", "bar bar-" + s, box));
  const slices = [];
  const NS = 6;
  for (let i = 0; i < NS; i++) {
    for (const color of [COL.crimson, COL.purple, COL.white]) {
      const s = el("div", "slice", box, {
        color,
        clipPath: `inset(${(i / NS) * 100}% -50% ${((NS - 1 - i) / NS) * 100}% -50%)`,
        zIndex: color === COL.white ? 3 : 2,
      });
      s.textContent = "DÉCOUVRIR";
      slices.push({ s, i, color });
    }
  }
  const ala = makeLabel(lockup, "À LA", 100, { invert: true });
  const decoPurple = el("div", "deco", lockup, { background: COL.purple });
  const decoCrimson = el("div", "deco", lockup, { background: COL.crimson });
  const decoWhite1 = el("div", "deco", lockup, { background: COL.white });
  const decoWhite2 = el("div", "deco", lockup, { background: COL.white });

  // ---------- mise en page (après chargement de la police) ----------
  let cams = [];
  let LK = {};

  function layout() {
    for (const L of [W1, W2, W3, W4]) {
      L.w = L.root.offsetWidth;
      L.h = L.root.offsetHeight;
    }
    W1.x = 0;
    W1.y = 0;
    W1.r = -90 + TILT;
    // Bloc empilé CHANTRES / TALENTS / HISTOIRES, incliné, à droite de DÉCOUVRIR (vertical)
    const g = 26;
    const rows = [
      [W2, -(W3.h / 2 + g + W2.h / 2), -0.1 * W3.w],
      [W3, 0, 0.05 * W3.w],
      [W4, W3.h / 2 + g + W4.h / 2, -0.04 * W3.w],
    ];
    const maxW = Math.max(W2.w, W3.w, W4.w);
    const bx = W1.h / 2 + 120 + maxW / 2;
    const by = -40;
    const c = Math.cos(rad(TILT));
    const s = Math.sin(rad(TILT));
    for (const [L, v, u] of rows) {
      L.x = bx + u * c - v * s;
      L.y = by + u * s + v * c;
      L.r = TILT;
    }
    [W1, W2, W3, W4].forEach(placeLabel);

    const focus = (L, fit) => ({
      x: L.x,
      y: L.y,
      rot: L.r - TILT,
      z: fit * Math.min(W / L.w, H / L.h),
    });
    // Cadrage global : boîte englobante de tous les mots (caméra à 0°)
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const L of [W1, W2, W3, W4]) {
      const cr = Math.cos(rad(L.r)), sr = Math.sin(rad(L.r));
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const px = L.x + (dx * L.w * cr) / 2 - (dy * L.h * sr) / 2;
        const py = L.y + (dx * L.w * sr) / 2 + (dy * L.h * cr) / 2;
        x0 = Math.min(x0, px); x1 = Math.max(x1, px);
        y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      }
    }
    const all = { x: (x0 + x1) / 2, y: (y0 + y1) / 2, rot: 0, z: (FORMAT === "v" ? 0.94 : 0.86) * Math.min(W / (x1 - x0), H / (y1 - y0)) };
    const f1 = focus(W1, FORMAT === "v" ? 0.9 : 0.84);
    const V = FORMAT === "v";
    const f2 = focus(W2, V ? 0.84 : 0.6);
    const f3 = focus(W3, V ? 0.88 : 0.66);
    const f4 = focus(W4, V ? 0.88 : 0.66);
    const zm = (f, k) => ({ ...f, z: f.z * k });
    cams = [
      { t: CUE.impact1, c: zm(f1, 1.5) },
      { t: CUE.impact1 + 0.3, c: f1, ease: E.outExpo },
      { t: CUE.whoosh1, c: zm(f1, 1.06), ease: E.lin },
      { t: CUE.land2, c: f2, ease: E.inOutQuart },
      { t: CUE.whoosh2, c: zm(f2, 1.04), ease: E.lin },
      { t: CUE.land3, c: { ...f3, rot: f3.rot }, ease: E.inOutQuart },
      { t: CUE.whoosh3, c: zm(f3, 1.04), ease: E.lin },
      { t: CUE.land4, c: f4, ease: E.inOutQuart },
      { t: CUE.dezoom, c: zm(f4, 1.04), ease: E.lin },
      { t: CUE.dezoomEnd, c: all, ease: E.inOutCubic },
      { t: 5.2, c: zm(all, 1.05), ease: E.lin },
    ];

    // Bloc-titre : taille de police ajustée à la largeur de l'écran
    const probe = 250;
    lockup.style.fontSize = probe + "px";
    sDecouv.textContent = "DÉCOUVERTE";
    rir.style.display = "none";
    const fullW = word.offsetWidth;
    sDecouv.textContent = "DÉCOUV";
    rir.style.display = "";
    const size = Math.min(250, (probe * W * (FORMAT === "v" ? 0.84 : 0.66)) / fullW);
    lockup.style.fontSize = size + "px";
    lockup.style.setProperty("--bw", Math.round(size * 0.075) + "px");
    const decouvW = sDecouv.offsetWidth;
    const pad = parseFloat(getComputedStyle(word).paddingLeft);
    erteMask.style.left = pad + decouvW + "px";
    // Boîte à la largeur finale (DÉCOUVERTE)
    const erteW = erteMask.offsetWidth;
    const boxW = pad * 2 + decouvW + erteW;
    box.style.width = boxW + "px";
    const boxH = box.offsetHeight;
    lockup.style.width = boxW + "px";
    lockup.style.height = boxH + "px";
    ala.root.style.fontSize = size * 0.5 + "px";
    ala.root.style.setProperty("--bw", "0px");
    const alaW = ala.root.offsetWidth;
    const alaH = ala.root.offsetHeight;
    LK = { size, boxW, boxH, alaW, alaH };
    ala.x = -size * 0.16 + alaW / 2;
    ala.y = -alaH / 2 + size * 0.02;
    ala.r = 0;
    // Bandes décoratives finales (en em de la police du titre)
    const deco = (e, left, top, w, h) => Object.assign(e.style, {
      left: left + "px", top: top + "px", width: w + "px", height: h + "px",
    });
    deco(decoPurple, boxW * 0.52, -size * 0.33, boxW * 0.62, size * 0.13);
    deco(decoWhite1, boxW * 0.7, -size * 0.13, boxW * 0.5, size * 0.035);
    deco(decoCrimson, -boxW * 0.22, boxH + size * 0.2, boxW * 0.55, size * 0.11);
    deco(decoWhite2, -boxW * 0.3, boxH + size * 0.4, boxW * 0.32, size * 0.035);
  }

  function camAt(t) {
    if (t <= cams[0].t) return cams[0].c;
    for (let i = 1; i < cams.length; i++) {
      const a = cams[i - 1], b = cams[i];
      if (t <= b.t) {
        const x = (b.ease || E.lin)(prog(t, a.t, b.t));
        return {
          x: lerp(a.c.x, b.c.x, x),
          y: lerp(a.c.y, b.c.y, x),
          rot: lerp(a.c.rot, b.c.rot, x),
          z: Math.exp(lerp(Math.log(a.c.z), Math.log(b.c.z), x)),
        };
      }
    }
    return cams[cams.length - 1].c;
  }

  // ---------- rendu d'une image ----------
  function render(t) {
    // 1. Bande d'ouverture (0 → 0,26 s)
    const ob = tw(t, 0, 0.26, -1.15, 1.15, E.inOutCubic);
    show(openBand, t < 0.27);
    placeBand(openBand, W / 2 + ob * W, H / 2, -62, L_OPEN, M * 0.2);

    // 2. Parcours caméra sur les mots (0,2 → 5,1 s)
    const worldOn = t >= CUE.impact1 && t < CUE.exit + 0.3;
    show(worldWrap, worldOn);
    if (worldOn) {
      const c = camAt(t);
      world.style.transform = `translate(${W / 2}px, ${H / 2}px) scale(${c.z}) rotate(${-c.rot}deg) translate(${-c.x}px, ${-c.y}px)`;
      const ex = prog(t, CUE.exit, CUE.exit + 0.24);
      worldWrap.style.transformOrigin = "50% 50%";
      worldWrap.style.transform = `scale(${lerp(1, 2.1, E.inCubic(ex))}) rotate(${lerp(0, -6, E.inCubic(ex))}deg)`;
      worldWrap.style.opacity = 1 - E.inCubic(prog(t, CUE.exit + 0.08, CUE.exit + 0.24));
      w1Crimson.style.transform = `scaleX(${E.outExpo(prog(t, 0.68, 0.9))})`;
      w1White.style.transform = `scaleX(${E.outExpo(prog(t, 0.92, 1.12))})`;
      // CHANTRES
      show(W2.root, t >= CUE.land2 - 0.16);
      drawBars(W2.bars, t, CUE.land2 - 0.14, CUE.land2 + 0.1);
      revealText(W2, t, CUE.land2 - 0.06, CUE.land2 + 0.22);
      w2White.style.transform = `scaleX(${E.outExpo(prog(t, CUE.land2 + 0.1, CUE.land2 + 0.35))})`;
      // TALENTS
      show(W3.root, t >= CUE.land3 - 0.14);
      drawBars(W3.bars, t, CUE.land3 - 0.12, CUE.land3 + 0.1);
      revealText(W3, t, CUE.land3 - 0.05, CUE.land3 + 0.22);
      w3Purple.style.transform = `scaleX(${E.outExpo(prog(t, CUE.land3 + 0.06, CUE.land3 + 0.36))})`;
      // HISTOIRES
      show(W4.root, t >= CUE.land4 - 0.14);
      drawBars(W4.bars, t, CUE.land4 - 0.12, CUE.land4 + 0.1);
      revealText(W4, t, CUE.land4 - 0.05, CUE.land4 + 0.22);
    }

    // 3. Bandes pourpre / cramoisi pendant HISTOIRES
    const hp = prog(t, CUE.bands, CUE.bands + 0.6);
    const hc = prog(t, CUE.bands + 0.1, CUE.bands + 0.68);
    const hw = prog(t, CUE.bands + 0.04, CUE.bands + 0.5);
    show(histPurple, hp > 0 && hp < 1);
    show(histCrimson, hc > 0 && hc < 1);
    show(histWhite, hw > 0 && hw < 1);
    placeBand(histPurple, W / 2 + lerp(1.4, -1.4, E.inOutCubic(hp)) * W, H * 0.73, TILT, W * 1.6, M * 0.065);
    placeBand(histCrimson, W / 2 + lerp(-1.4, 1.4, E.inOutCubic(hc)) * W, H * 0.24, TILT, W * 1.6, M * 0.042);
    placeBand(histWhite, W / 2 + lerp(1.3, -1.3, E.inOutCubic(hw)) * W, H * 0.8, TILT, W * 1.2, M * 0.012);

    // 4. Respiration : médaillon (5,0 → 6,86 s)
    const medOn = t >= CUE.drop && t < CUE.irisEnd;
    show(med, medOn);
    vignette.style.opacity =
      0.9 * E.inOutCubic(prog(t, CUE.drop, CUE.drop + 0.4)) * (1 - E.inOutCubic(prog(t, CUE.iris, CUE.irisEnd)));
    if (medOn) {
      const push = tw(t, CUE.drop + 0.3, CUE.iris, 0.965, 1.0, E.lin);
      const iris = E.inCubic(prog(t, CUE.iris, CUE.irisEnd));
      const s = push * lerp(1, 0.86, iris);
      med.style.transform = `translate(${W / 2 - D / 2}px, ${H / 2 - D / 2}px) scale(${s})`;
      med.style.clipPath = `circle(${lerp(52, 0, iris)}% at 50% 50%)`;
      // tracé du cercle émeraude puis du filet doré
      const rp = E.inOutCubic(prog(t, CUE.drop, CUE.ringEnd));
      const gp = E.inOutCubic(prog(t, CUE.drop + 0.12, CUE.ringEnd + 0.08));
      ringMain.c.setAttribute("stroke-dashoffset", ringMain.len * (1 - rp));
      ringGold.c.setAttribute("stroke-dashoffset", ringGold.len * (1 - gp));
      svg.style.opacity = 1 - prog(t, 5.74, 5.92);
      // révélation de l'illustration depuis le centre
      const rv = E.outCubic(prog(t, CUE.drop + 0.3, CUE.drop + 0.74));
      medClip.style.clipPath = `circle(${rv * 50.5}% at 50% 50%)`;
      medGlow.style.opacity = E.outCubic(prog(t, CUE.drop + 0.45, CUE.drop + 0.9));
      // halo doré qui « respire » (lumière seulement, l'image n'est pas déformée)
      const hr = prog(t, CUE.bell, CUE.bell + 0.35);
      halo.style.opacity = hr * (0.26 + 0.12 * Math.sin((2 * Math.PI * (t - CUE.bell)) / 0.95));
      // reflets sur l'eau
      for (const g of glints) {
        const tw1 = Math.max(0, Math.sin(2 * Math.PI * (t * g.freq + g.phase)));
        g.e.style.opacity = prog(t, CUE.bell, CUE.bell + 0.3) * Math.pow(tw1, 3) * 0.85;
        const dx = Math.sin(t * 1.6 + g.phase * 6.28) * D * 0.004;
        g.e.style.transform = `translate(${g.x + dx}px, ${g.y}px)`;
      }
    }

    // 5. Éclair blanc à la fermeture du médaillon
    const fd = prog(t, CUE.flash, CUE.flash + 0.1);
    const fr = Math.hypot(W, H) * 0.6 * E.outExpo(fd);
    show(flashDot, fd > 0 && t < CUE.flash + 0.28);
    Object.assign(flashDot.style, {
      width: fr * 2 + "px",
      height: fr * 2 + "px",
      left: W / 2 - fr + "px",
      top: H / 2 - fr + "px",
      opacity: 1 - E.outCubic(prog(t, CUE.flash + 0.1, CUE.flash + 0.22)),
    });

    // 6. Montée : tranches de DÉCOUVRIR qui convergent (→ 7,4 s), puis signature
    const lkOn = t >= CUE.flash + 0.06;
    show(lockup, lkOn);
    if (lkOn) {
      const settle = tw(t, CUE.impact2, CUE.impact2 + 0.4, 1.08, 1.0, E.outCubic);
      const sh = 1 - prog(t, CUE.impact2, CUE.impact2 + 0.26);
      const amp = M * 0.012 * sh * sh;
      const dx = t >= CUE.impact2 ? amp * Math.sin(t * 97) : 0;
      const dy = t >= CUE.impact2 ? amp * Math.cos(t * 71) : 0;
      const cy = H / 2 + (FORMAT === "v" ? 0 : H * 0.03);
      lockup.style.transformOrigin = "50% 50%";
      lockup.style.transform = `translate(${W / 2 - LK.boxW / 2 + dx}px, ${cy - LK.boxH / 2 + dy}px) rotate(${TILT}deg) scale(${settle})`;

      const conv = t < CUE.impact2;
      show(sDecouv, !conv);
      show(rir, !conv);
      for (const sl of slices) {
        show(sl.s, conv);
        if (!conv) continue;
        const lag = sl.color === COL.white ? 0 : sl.color === COL.purple ? 0.035 : 0.07;
        const p = E.inQuad(prog(t - lag, CUE.flash + 0.06, CUE.impact2));
        const dir = sl.i % 2 === 0 ? -1 : 1;
        const dist = W * (0.8 + 0.1 * ((sl.i * 3) % 4));
        sl.s.style.transform = `translateX(${dir * dist * (1 - p)}px)`;
        sl.s.style.opacity = sl.color === COL.white ? 1 : 0.95 * (1 - prog(t, CUE.impact2 - 0.08, CUE.impact2));
      }
      // RIR tombe, ERTE glisse
      rirLetters.forEach((s, i) => {
        const p = E.inCubic(prog(t, CUE.rirFall + i * 0.03, CUE.rirFall + 0.3 + i * 0.03));
        s.style.transform = `translateY(${p * 1.3}em) rotate(${p * (10 + i * 8)}deg)`;
        s.style.opacity = 1 - prog(t, CUE.rirFall + 0.12 + i * 0.03, CUE.rirFall + 0.3 + i * 0.03);
      });
      erteLetters.forEach((s, i) => {
        const p = E.outExpo(prog(t, CUE.erte + i * 0.035, CUE.erte + 0.3 + i * 0.035));
        s.style.transform = `translateX(${(1 - p) * 260}%)`;
      });
      show(erteMask, t >= CUE.erte);
      drawBars(boxBars, t, CUE.erte, CUE.stamp);
      // plaque blanche (effet d'étiquette en relief)
      const pp = E.outCubic(prog(t, CUE.stamp - 0.06, CUE.stamp + 0.12));
      plate.style.transform = `translate(${pp * LK.size * 0.15}px, ${pp * LK.size * 0.15}px)`;
      show(plate, pp > 0);
      // « À LA » tamponné
      const sp = prog(t, CUE.stamp - 0.1, CUE.stamp);
      show(ala.root, sp > 0);
      const ss = lerp(1.7, 1, E.outCubic(sp));
      ala.root.style.transform = `translate(${ala.x}px, ${ala.y}px) rotate(${lerp(-4, 0, sp)}deg) translate(-50%, -50%) scale(${ss})`;
      ala.root.style.opacity = E.outCubic(sp);
      // bandes finales
      const b1 = E.outCubic(prog(t, CUE.stamp - 0.04, CUE.still));
      const b2 = E.outCubic(prog(t, CUE.stamp, CUE.still));
      decoPurple.style.transform = `translateX(${(1 - b1) * W * 1.2}px)`;
      decoWhite1.style.transform = `translateX(${(1 - b2) * W * 1.4}px)`;
      decoCrimson.style.transform = `translateX(${-(1 - b1) * W * 1.2}px)`;
      decoWhite2.style.transform = `translateX(${-(1 - b2) * W * 1.4}px)`;
      for (const d of [decoPurple, decoWhite1, decoCrimson, decoWhite2]) show(d, t >= CUE.stamp - 0.04);
    }
  }

  const ready = (async () => {
    await document.fonts.load('100px "Anton"', "DÉCOUVRIRÀLACHANTRESTALENTSHISTOIRES");
    await document.fonts.ready;
    if (!medImg.complete) await new Promise((r) => (medImg.onload = r));
    layout();
    render(0);
  })();

  window.JINGLE = { ready, render, W, H, FORMAT, duration: CUE.duration, fps: CUE.fps };

  // Aperçu dans le navigateur (n'est pas le fichier vidéo final)
  ready.then(() => {
    if (Q.has("t")) render(parseFloat(Q.get("t")));
    if (Q.get("play") === "1") {
      const audio = new Audio("../audio/jingle.wav");
      let t0 = null;
      const loop = (now) => {
        if (t0 === null) {
          t0 = now;
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
        const t = audio.paused ? (now - t0) / 1000 : audio.currentTime;
        render(Math.min(t, CUE.duration));
        if (t < CUE.duration + 1) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  });
})();
