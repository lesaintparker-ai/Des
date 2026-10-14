// Teaser « Suura passe de WhatsApp à l'application » — vertical 1080x1920.
// Même moteur déterministe que scenes.js : MD.renderAt(t) calcule chaque image.
window.MD_CONFIG = {
  fps: 30, width: 1080, height: 1920,
  voice: null, // ex. { file: "assets/voix-teaser.mp3", volume: 1, sfxVolume: .35 }
  colors: { bgCenter: "#0d6a4e", bgEdge: "#021f16", accent: "#1f9a6e", accentDark: "#106e56", gold: "#f5c518", card: "#f0f8f2", ink: "#0b2e22" },
  logo: "assets/suura.png",
  intro: ["Tu recharges déjà", "avec Suura sur *WhatsApp* ?"],
  news: ["Bonne nouvelle…", "Suura arrive", "en *application* !"],
  // écrans réels de l'app (assets/app) et leur légende
  screens: [
    { img: "assets/app/home.jpg", title: "Ton accueil", sub: "Favoris, historique et promos" },
    { img: "assets/app/menu.jpg", title: "Crédit ou pass", sub: "En un seul tap" },
    { img: "assets/app/operateur.jpg", title: "Orange, MTN, Moov", sub: "Tous tes réseaux" },
    { img: "assets/app/pass.jpg", title: "Tous les forfaits", sub: "D'un coup d'œil" },
    { img: "assets/app/recap.jpg", title: "Récap clair", sub: "Frais affichés avant de payer" },
    { img: "assets/app/payer.jpg", title: "Paie en mobile money", sub: "Wave, Orange Money, MTN, Moov, Djamo" },
  ],
  soon: { label: "Installation de l'app Suura", almost: "Presque prêt…", word: "BIENTÔT" },
  claim: ["Le même Suura.", "*Encore plus simple.*"],
  outro: { title: "L'application Suura", soon: "BIENTÔT", wait: "En attendant, écris « Bonjour Suura »", waitSub: "sur WhatsApp", url: "suura.app" },
};

(function () {
  const C = window.MD_CONFIG, W = C.width, H = C.height;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    outCubic: x => 1 - Math.pow(1 - x, 3), inCubic: x => x * x * x,
    inOutCubic: x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outBack: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    outQuint: x => 1 - Math.pow(1 - x, 5),
  };
  const ease = (t, a, b, fn = E.outCubic) => fn(prog(t, a, b));
  const bump = (t, a, b) => Math.sin(Math.PI * prog(t, a, b));
  const el = html => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const $ = (r, s) => r.querySelector(s), $$ = (r, s) => [...r.querySelectorAll(s)];
  function tf(e, p = {}) {
    const { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, o = 1, blur = 0 } = p;
    e.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`;
    e.style.opacity = o; e.style.visibility = o <= .001 ? "hidden" : "visible";
    e.style.filter = blur > .05 ? `blur(${blur}px)` : "none";
  }
  function fit(e, maxW) { let fs = parseFloat(getComputedStyle(e).fontSize); while (e.offsetWidth > maxW && fs > 20) { fs -= 2; e.style.fontSize = fs + "px"; } }
  const cx = e => (W - e.offsetWidth) / 2;
  const rich = s => s.replace(/\*(.+?)\*/g, `<span class="g">$1</span>`).replace(/ ([?!:])/g, "&nbsp;$1");
  const SFX = [], sfx = (t, type) => SFX.push({ t: +t.toFixed(3), type });

  const logo = (size) => `<img src="${C.logo}" style="width:${size}px;height:${size}px;display:block" alt="">`;
  const waLogo = size => `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><circle cx="12" cy="12" r="12" fill="#25d366"/><path d="M12 5.2a6.8 6.8 0 0 0-5.9 10.2L5.2 18.8l3.5-.9A6.8 6.8 0 1 0 12 5.2z" fill="#fff"/><path d="M9.6 8.6c.1-.3.3-.3.5-.3h.4c.1 0 .3 0 .4.3l.6 1.4c0 .1 0 .3-.1.4l-.4.5c-.1.1-.1.2 0 .3.3.5.7 1 1.2 1.4.5.4 1 .6 1.2.7.1.1.3 0 .4-.1l.5-.6c.1-.1.3-.2.4-.1l1.3.6c.1.1.3.1.3.3 0 .2 0 .7-.3 1.1-.3.4-.9.7-1.4.7-.4 0-1 .1-2.4-.6-1.6-.7-2.7-2.4-2.8-2.5-.1-.1-.6-.9-.6-1.7 0-.8.4-1.2.6-1.4z" fill="#25d366"/></svg>`;
  const check = c => `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="50" fill="${c}"/><path d="M29 51 L44 66 L72 36" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const lines = (arr, fs, cls = "") => arr.map(l => el(`<div class="abs clip"><div class="big ${cls}" style="font-size:${fs}px">${rich(l)}</div></div>`));

  const T = { intro: 0, news: 3.6, show: 7.4, soon: 20.6, claim: 24.6, outro: 27.4, end: 32.4 };
  const SHOW_STEP = 2.15; // durée par écran
  const scenes = []; let stage, bgP, bgG, fade;
  const scene = (a, b, build) => { const root = el(`<div class="scene"></div>`); stage.appendChild(root); scenes.push({ a, b, root, up: build(root) }); };

  // ── téléphone partagé : WhatsApp → splash → app ──────────
  function buildPhone() {
    const N = C.screens.length;
    sfx(.1, "whoosh"); sfx(.9, "send"); sfx(1.5, "pop"); sfx(4.6, "whoosh"); sfx(5.0, "success");
    C.screens.forEach((_, i) => i && sfx(T.show + i * SHOW_STEP, "whoosh"));
    sfx(T.soon - .1, "whoosh");
    scene(0, T.soon + .6, root => {
      const phone = el(`<div class="abs phone" style="transform-style:preserve-3d"><div class="screen">
        <div class="wa" style="position:absolute;inset:0;display:flex;flex-direction:column;background:#0b141a">
          <div class="sb"><span>08:45</span><span>▂▄▆ LTE ▮</span></div>
          <div class="wa-head"><span style="font-size:36px">←</span><span style="width:72px;height:72px">${logo(72)}</span><div><div class="hn">Suura</div><div class="hs">Compte professionnel</div></div></div>
          <div class="chat"><div class="col">
            <div class="msg me m0">Bonjour Suura<span class="tm">08:45<b>✓✓</b></span></div>
            <div class="msg in m1">👋 <b>Bienvenue sur Suura</b> 🇨🇮<br><i class="it">La solution qui connecte l'Afrique</i><br><br>Que veux-tu faire&nbsp;?<span class="tm">08:45</span><div class="bt"><div>📦 Souscrire à un pass</div></div></div>
          </div></div>
          <div class="wa-input"><div class="box"><span class="ph">Message</span></div><div class="send"><svg viewBox="0 0 24 24" width="40" height="40"><path d="M3 20.5 21 12 3 3.5l.01 6.6L15 12 3.01 13.9z" fill="#0b141a"/></svg></div></div>
        </div>
        <div class="app" style="position:absolute;inset:0;background:#fbf6dc;overflow:hidden">
          <div class="sb" style="background:#fbf6dc;color:#0b2e22;position:relative;z-index:2"><span>08:45</span><span>▂▄▆ LTE ▮</span></div>
          ${C.screens.map(s => `<img class="shot" src="${s.img}" style="position:absolute;left:0;top:74px;width:100%;display:block" alt="">`).join("")}
        </div>
        <div class="splash" style="position:absolute;inset:0;background:${C.colors.accentDark};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px">
          <div class="sl">${logo(220)}</div><div class="st" style="font-family:Outfit;font-weight:800;font-size:96px;color:#fff;letter-spacing:-2px">Suura</div></div>
      </div></div>`);
      root.append(phone);
      const wa = $(phone, ".wa"), app = $(phone, ".app"), splash = $(phone, ".splash"), sl = $(phone, ".sl"), stt = $(phone, ".st");
      const m0 = $(phone, ".m0"), m1 = $(phone, ".m1"), shots = $$(phone, ".shot");
      return (lt, t) => {
        // position : bas (intro) → centre (annonce) → bas (démo) → sortie
        const enter = ease(t, 0, .8), toNews = ease(t, T.news, T.news + .7, E.inOutCubic), toShow = ease(t, T.show - .5, T.show + .2, E.inOutCubic);
        const out = ease(t, T.soon - .2, T.soon + .4, E.inCubic);
        const flip = ease(t, 4.3, 5.0, E.inOutCubic); // rotation pendant le passage WhatsApp → app
        const y = lerp(lerp(lerp(1950, 520, enter), 700, toNews), 470, toShow) + out * 1400;
        const s = lerp(lerp(.92, .62, toNews), .92, toShow);
        tf(phone, { x: 180, y, s, ry: Math.sin(flip * Math.PI) * 70 + Math.sin(t * .9) * 2.5, rx: (1 - enter) * 20 });
        // contenu : WhatsApp jusqu'au milieu du flip, puis splash, puis app
        const showApp = flip >= .5;
        wa.style.display = showApp ? "none" : "flex";
        tf(m0, { s: .85 + .15 * ease(t, .9, 1.2, E.outBack), o: prog(t, .9, 1.0) });
        tf(m1, { s: .85 + .15 * ease(t, 1.5, 1.8, E.outBack), o: prog(t, 1.5, 1.6) });
        tf(splash, { o: showApp ? 1 - prog(t, T.show - .5, T.show - .1) : 0 });
        tf(sl, { s: ease(t, 4.9, 5.4, E.outBack) * (1 + .04 * Math.sin(t * 4)) });
        tf(stt, { y: (1 - ease(t, 5.2, 5.6)) * 40, o: prog(t, 5.2, 5.4) });
        app.style.display = showApp ? "block" : "none";
        // carrousel d'écrans façon « swipe »
        let cur = 0;
        for (let i = 1; i < shots.length; i++) cur += ease(t, T.show + i * SHOW_STEP - .25, T.show + i * SHOW_STEP + .2, E.inOutCubic);
        shots.forEach((im, i) => {
          const d = i - cur, k = prog(t, T.show + i * SHOW_STEP - .25, T.show + (i + 1) * SHOW_STEP);
          tf(im, { x: d * 700, s: 1 + .03 * k, o: Math.abs(d) < 1.2 ? 1 : 0 });
        });
      };
    });
  }

  // ── 1. Intro WhatsApp ──────────────────────────────────
  function buildIntro() {
    scene(0, T.news + .5, root => {
      const L = lines(C.intro, 92);
      const chip = el(`<div class="abs pill" style="font-size:34px">${waLogo(44)}WhatsApp</div>`);
      root.append(chip, ...L);
      let f = false;
      return lt => {
        if (!f) { L.forEach(e => fit(e.firstElementChild, 980)); f = true; }
        const out = ease(lt, 3.3, 3.8, E.inCubic);
        tf(chip, { x: cx(chip), y: 150, s: ease(lt, .1, .45, E.outBack), o: 1 - out });
        L.forEach((e, i) => { tf(e, { x: cx(e), y: 250 + i * 110 - out * 60, o: 1 - out }); tf(e.firstElementChild, { y: (1 - ease(lt, .2 + i * .15, .65 + i * .15, E.outQuint)) * 120 }); });
      };
    });
  }

  // ── 2. Annonce : WhatsApp → App ─────────────────────────
  function buildNews() {
    sfx(T.news + .2, "pop"); sfx(T.news + 1.2, "ding");
    scene(T.news, T.show + .3, root => {
      const L = lines(C.news, 110);
      const flow = el(`<div class="abs" style="display:flex;align-items:center;gap:34px">
        <span class="f1">${waLogo(120)}</span>
        <svg class="ar" width="140" height="40" viewBox="0 0 140 40"><path d="M5 20h120M105 5l20 15-20 15" stroke="${C.colors.gold}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" class="ap"/></svg>
        <span class="f2" style="display:block;border-radius:30px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,.35)">${logo(120)}</span></div>`);
      root.append(...L, flow);
      const f1 = $(flow, ".f1"), f2 = $(flow, ".f2"), ap = $(flow, ".ap");
      L[0].firstElementChild.style.color = "rgba(255,255,255,.75)"; L[0].firstElementChild.style.fontSize = "64px";
      let f = false;
      return lt => {
        if (!f) { L.forEach(e => fit(e.firstElementChild, 1000)); f = true; }
        const out = ease(lt, 3.4, 3.9, E.inCubic);
        root.style.opacity = 1 - out;
        L.forEach((e, i) => { tf(e, { x: cx(e), y: [180, 270, 390][i] - out * 80 }); tf(e.firstElementChild, { y: (1 - ease(lt, .1 + i * .35, .55 + i * .35, E.outQuint)) * 140 }); });
        tf(flow, { x: cx(flow), y: 560 + (1 - ease(lt, .6, 1.0)) * 60, o: prog(lt, .6, .8) });
        tf(f1, { s: ease(lt, .6, .9, E.outBack) * (1 - .15 * prog(lt, 1.3, 1.6)) });
        ap.setAttribute("stroke-dashoffset", 1 - ease(lt, .9, 1.4, E.inOutCubic));
        tf(f2, { s: ease(lt, 1.3, 1.7, E.outBack) * (1 + .06 * bump(lt, 1.7, 2.1)) });
      };
    });
  }

  // ── 3. Démo : légendes des écrans ───────────────────────
  function buildCaptions() {
    const N = C.screens.length;
    scene(T.show - .3, T.soon + .3, root => {
      const tag = el(`<div class="abs f-label">Aperçu de l'app</div>`);
      const items = C.screens.map((s, i) => el(`<div class="abs" style="text-align:center;width:1000px">
        <div class="clip"><div class="big" style="font-size:84px;display:inline-block">${rich(s.title)}</div></div>
        <div class="f-sub" style="width:auto;color:var(--gold);font-size:40px;margin-top:6px">${s.sub}</div></div>`));
      const dots = el(`<div class="abs dashes">${"<i></i>".repeat(N)}</div>`);
      root.append(tag, ...items, dots);
      const ds = $$(dots, "i");
      let f = false;
      return (lt, t) => {
        if (!f) { items.forEach(e => fit($(e, ".big"), 980)); f = true; }
        const o = prog(t, T.show - .3, T.show + .2) * (1 - prog(t, T.soon - .2, T.soon + .2));
        tf(tag, { x: cx(tag), y: 80, o });
        items.forEach((e, i) => {
          const a = T.show + i * SHOW_STEP, b = a + SHOW_STEP, last = i === N - 1;
          const inn = ease(t, a - .1, a + .4, E.outQuint), outq = last ? prog(t, T.soon - .2, T.soon + .2) : ease(t, b - .25, b + .1, E.inCubic);
          tf(e, { x: 40, y: 150 - outq * 40, o: (t >= a - .1 ? 1 : 0) * (1 - outq) });
          tf($(e, ".big"), { y: (1 - inn) * 110 });
          tf($(e, ".f-sub"), { y: (1 - ease(t, a + .1, a + .5)) * 30, o: prog(t, a + .1, a + .35) });
        });
        tf(dots, { x: (W - dots.offsetWidth) / 2, y: 1850, o });
        ds.forEach((d, i) => { const a = T.show + i * SHOW_STEP, on = t >= a - .1 && (i === N - 1 || t < a + SHOW_STEP - .1); d.style.width = on ? "70px" : "36px"; d.style.background = on ? C.colors.gold : "rgba(255,255,255,.22)"; });
      };
    });
  }

  // ── 3 bis. Transition « bientôt » : chargement bloqué à 99 % ──
  function buildSoon() {
    const S = C.soon, s0 = T.soon;
    sfx(s0, "whoosh"); sfx(s0 + .6, "pop");
    for (let k = 0; k < 9; k++) sfx(s0 + .9 + k * .17, "tick");
    sfx(s0 + 2.5, "alert"); sfx(s0 + 2.95, "whoosh"); sfx(s0 + 3.1, "ding");
    scene(s0 - .05, T.claim + .3, root => {
      const stripes = [C.colors.gold, C.colors.accent, "#021f16"].map(c => el(`<div class="abs" style="width:1700px;height:2600px;background:${c};left:0;top:-340px"></div>`));
      const icon = el(`<div class="abs" style="border-radius:50%;box-shadow:0 30px 80px rgba(0,0,0,.45)">${logo(220)}</div>`);
      const label = el(`<div class="abs f-label" style="font-size:32px">${S.label}</div>`);
      const bar = el(`<div class="abs" style="width:820px;height:30px;border-radius:15px;background:rgba(255,255,255,.14);overflow:hidden"><div class="bf" style="height:100%;width:100%;background:linear-gradient(90deg,${C.colors.accent},${C.colors.gold});transform-origin:0 50%"></div></div>`);
      const pct = el(`<div class="abs" style="font-family:Outfit;font-weight:800;font-size:150px;color:#fff;letter-spacing:-3px;font-variant-numeric:tabular-nums">0 %</div>`);
      const almost = el(`<div class="abs sub2" style="font-size:40px">${S.almost}</div>`);
      const word = el(`<div class="abs" style="font-family:Outfit;font-weight:800;font-size:240px;letter-spacing:8px;color:var(--gold);line-height:1;text-shadow:0 20px 60px rgba(0,0,0,.4)">${S.word}</div>`);
      const flash = el(`<div class="abs" style="width:${W}px;height:${H}px;background:#fff"></div>`);
      root.append(icon, label, bar, pct, almost, word, ...stripes, flash);
      const bf = $(bar, ".bf");
      let f = false;
      return lt => {
        if (!f) { fit(word, 1020); f = true; }
        // volets diagonaux qui balayent l'écran et masquent la sortie du téléphone
        stripes.forEach((st, i) => { const p = ease(lt, i * .08, .75 + i * .08, E.inOutCubic); tf(st, { x: lerp(-2300, 2300, p), rz: -14 }); });
        const out = ease(lt, 3.6, 4.0, E.inCubic);
        root.style.opacity = 1 - out;
        const load = ease(lt, .9, 2.4, E.inOutCubic) * .99, stuck = lt > 2.4;
        const shake = Math.sin(lt * 70) * 10 * bump(lt, 2.45, 2.85);
        const gone = ease(lt, 2.85, 3.05, E.inCubic);
        tf(icon, { x: W / 2 - 110, y: 470, s: ease(lt, .45, .85, E.outBack) * (1 - gone * .3), o: prog(lt, .45, .55) * (1 - gone) });
        tf(label, { x: cx(label), y: 760, o: prog(lt, .6, .8) * (1 - gone) });
        tf(bar, { x: W / 2 - 410 + shake, y: 850, o: prog(lt, .7, .85) * (1 - gone) });
        bf.style.transform = `scaleX(${load})`;
        pct.textContent = `${Math.round(load * 100)} %`;
        pct.style.color = stuck ? C.colors.gold : "#fff";
        tf(pct, { x: cx(pct) + shake, y: 920, o: prog(lt, .8, .95) * (1 - gone) });
        tf(almost, { x: cx(almost), y: 1110, o: prog(lt, 2.4, 2.6) * (1 - gone) });
        const slam = ease(lt, 2.95, 3.25, E.outCubic), wob = Math.sin(lt * 60) * 8 * bump(lt, 3.2, 3.5);
        tf(word, { x: cx(word) + wob, y: 820, s: lerp(2.6, 1, slam) * (1 + .03 * Math.sin(lt * 5) * prog(lt, 3.4, 3.6)), o: prog(lt, 2.95, 3.05), blur: (1 - slam) * 14 });
        tf(flash, { o: .7 * bump(lt, 3.15, 3.45) });
      };
    });
  }

  // ── 4. Promesse ─────────────────────────────────────────
  function buildClaim() {
    sfx(T.claim + .2, "pop"); sfx(T.claim + .7, "pop");
    scene(T.claim, T.outro + .4, root => {
      const L = lines(C.claim, 120);
      root.append(...L);
      let f = false;
      return lt => {
        if (!f) { L.forEach(e => fit(e.firstElementChild, 1000)); f = true; }
        const out = ease(lt, 2.5, 2.95, E.inCubic);
        root.style.opacity = 1 - out;
        L.forEach((e, i) => { tf(e, { x: cx(e), y: 780 + i * 150, s: 1 + out * .1 }); tf(e.firstElementChild, { y: (1 - ease(lt, .15 + i * .45, .6 + i * .45, E.outQuint)) * 170 }); });
      };
    });
  }

  // ── 5. Fin : BIENTÔT ───────────────────────────────────
  function buildOutro() {
    const O = C.outro;
    sfx(T.outro + .2, "success"); sfx(T.outro + 1.0, "ding"); sfx(T.outro + 2.2, "pop");
    scene(T.outro, T.end, root => {
      const rings = [0, 1, 2].map(() => el(`<div class="abs ring" style="border-color:rgba(255,255,255,.18)"></div>`));
      const lg = el(`<div class="abs" style="border-radius:50%;box-shadow:0 30px 80px rgba(0,0,0,.45)">${logo(260)}</div>`);
      const title = el(`<div class="abs tagline" style="font-size:76px">${O.title}</div>`);
      const soon = el(`<div class="abs" style="font-family:Outfit;font-weight:800;font-size:200px;letter-spacing:6px;color:var(--gold);line-height:1">${O.soon}</div>`);
      const wait = el(`<div class="abs cta" style="font-size:38px"><span class="wa" style="background:none">${waLogo(64)}</span>${O.wait}</div>`);
      const waitSub = el(`<div class="abs sub2">${O.waitSub}</div>`);
      const url = el(`<div class="abs url">${O.url}</div>`);
      root.append(...rings, lg, title, soon, wait, waitSub, url);
      let f = false;
      return lt => {
        if (!f) { fit(soon, 1000); fit(wait, 1010); fit(title, 1000); f = true; }
        rings.forEach((r, i) => { const p = ((lt - .2 - i * .6) % 1.8 + 1.8) % 1.8 / 1.8; tf(r, { x: W / 2 - 180, y: 470 - 180, s: 1 + p * 2.4, o: lt > .2 + i * .6 ? (1 - p) * .7 : 0 }); });
        tf(lg, { x: W / 2 - 130, y: 340, s: ease(lt, .1, .55, E.outBack), o: prog(lt, .1, .25) });
        tf(title, { x: cx(title), y: 680 + (1 - ease(lt, .5, .9)) * 40, o: prog(lt, .5, .75) });
        tf(soon, { x: cx(soon), y: 800, s: ease(lt, .9, 1.35, E.outBack) * (1 + .03 * Math.sin(lt * 4) * prog(lt, 1.4, 1.7)), o: prog(lt, .9, 1.0) });
        tf(wait, { x: cx(wait), y: 1180, s: ease(lt, 2.0, 2.4, E.outBack), o: prog(lt, 2.0, 2.15) });
        tf(waitSub, { x: cx(waitSub), y: 1330, o: prog(lt, 2.3, 2.6) });
        tf(url, { x: cx(url), y: 1460 + (1 - ease(lt, 2.6, 3.0)) * 30, o: prog(lt, 2.6, 2.85) });
      };
    });
  }

  window.MD = {
    duration: T.end, fps: C.fps, sfx: SFX,
    init(s) {
      stage = s;
      for (const [k, v] of Object.entries(C.colors)) stage.style.setProperty("--" + k, v);
      bgP = el(`<svg id="bg-pattern" width="${W + 400}" height="${H + 400}"><defs><pattern id="pt" width="180" height="180" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="#fff" stroke-width="2"><circle cx="90" cy="90" r="18"/><circle cx="90" cy="90" r="38"/><circle cx="90" cy="90" r="58" stroke-dasharray="5 9"/>
        <path d="M0 0 Q40 45 0 90 M180 0 Q140 45 180 90 M0 180 Q40 135 0 90 M180 180 Q140 135 180 90"/></g></pattern></defs><rect width="100%" height="100%" fill="url(#pt)"/></svg>`);
      bgG = el(`<div id="bg-glow"></div>`);
      stage.append(bgP, bgG);
      buildIntro(); buildNews(); buildCaptions(); buildPhone(); buildSoon(); buildClaim(); buildOutro();
      stage.append(el(`<div id="vignette"></div>`));
      fade = el(`<div id="fade"></div>`); stage.append(fade);
      SFX.sort((a, b) => a.t - b.t);
    },
    renderAt(t) {
      bgP.style.transform = `translate(${(t * 9) % 180}px, ${(t * 14) % 180}px)`;
      bgG.style.transform = `translate(${-200 + Math.sin(t * .3) * 260}px, ${-300 + Math.cos(t * .23) * 260}px)`;
      for (const sc of scenes) { const on = t >= sc.a && t <= sc.b; sc.root.style.display = on ? "block" : "none"; if (on) sc.up(t - sc.a, t); }
      fade.style.opacity = Math.max(1 - prog(t, 0, .25), prog(t, T.end - .6, T.end));
    },
  };
})();
