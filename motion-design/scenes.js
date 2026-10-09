// Moteur d'animation déterministe : chaque image est calculée à partir du temps t
// (aucune transition CSS), ce qui permet un rendu MP4 image par image.
(function () {
  const C = window.MD_CONFIG;
  const W = C.width, H = C.height;

  // ── TIMELINE calée sur la voix off (assets/voix-off.mp3, 40,5 s) ──
  //  0,1  « Plus de crédit en pleine discussion ? »
  //  2,0  « Avec Suura, recharge ton crédit en 30 secondes et continue ta discussion ! »
  //  6,0  « C'est simple ! Écris Bonjour Suura sur WhatsApp. Entre ton numéro, choisis ton pass et passe au paiement. »
  // 12,2  « Wave, Orange Money, MTN, Moov ou Djamo… à toi de choisir. Et voilà ! »
  // 17,1  « Ton pass arrive aussitôt. »            18,6 « Pass activé en moins de 30 secondes. »
  // 20,7  « Instantané. Pas d'attente, pas de file. »
  // 23,2  « Orange, MTN, Moov : tous tes réseaux au même endroit. »
  // 26,6  « Et tout ça, sans carte bancaire. »     28,5 « Même maman au village peut recevoir son crédit grâce à toi ! »
  // 31,5  « Simple comme un message. Disponible 24h sur 24, sur WhatsApp et Telegram. »
  // 36,2  « Suura, la solution qui te connecte. »  38,4 « Écris Bonjour Suura dès maintenant ! »
  const T = {
    hook: 0, promise: 1.75, chat: 5.9, confirm: 18.4,
    feats: [20.6, 23.05, 26.5, 28.4], stats: 31.3, outro: 36.0, end: 41.3,
  };

  // ── Maths & easing ─────────────────────────────────────────
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    outCubic: x => 1 - Math.pow(1 - x, 3),
    inCubic: x => x * x * x,
    inOutCubic: x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outBack: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    outQuint: x => 1 - Math.pow(1 - x, 5),
  };
  const ease = (t, a, b, fn = E.outCubic) => fn(prog(t, a, b));
  const bump = (t, a, b) => Math.sin(Math.PI * prog(t, a, b));
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const nb = s => s.replace(/ ([?!:;])/g, "&nbsp;$1");
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let r = Math.imul(seed ^ seed >>> 15, 1 | seed); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; };

  // ── DOM helpers ────────────────────────────────────────────
  const el = html => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const $ = (root, sel) => root.querySelector(sel);
  const $$ = (root, sel) => [...root.querySelectorAll(sel)];
  function tf(e, p = {}) {
    const { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, o = 1, blur = 0 } = p;
    const sx = p.sx ?? s, sy = p.sy ?? s;
    e.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sx},${sy})`;
    e.style.opacity = o;
    e.style.visibility = o <= 0.001 ? "hidden" : "visible";
    e.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
  }
  // Position (non transformée) du centre d'un élément dans un ancêtre positionné
  function center(e, anc) {
    let x = e.offsetWidth / 2, y = e.offsetHeight / 2;
    while (e && e !== anc) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y };
  }
  // Réduit la taille de police jusqu'à ce que l'élément tienne dans maxW
  function fit(e, maxW) {
    let fs = parseFloat(getComputedStyle(e).fontSize);
    while (e.offsetWidth > maxW && fs > 20) { fs -= 2; e.style.fontSize = fs + "px"; }
  }
  const cx = e => (W - e.offsetWidth) / 2;
  const rich = s => s.replace(/\*(.+?)\*/g, `<span class="hlbox">$1<span class="ul"></span></span>`);

  // ── Sons (synthétisés au rendu par render.mjs) ─────────────
  const SFX = [];
  const sfx = (t, type) => SFX.push({ t: +t.toFixed(3), type });

  // ── Graphismes réutilisables ───────────────────────────────
  const check = (bg, stroke = "#fff") => `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="50" fill="${bg}"/><path class="ck" d="M29 51 L44 66 L72 36" fill="none" stroke="${stroke}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/></svg>`;
  const logoMark = () => C.brand.logo ? `<img src="${C.brand.logo}" alt="">` :
    `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${C.colors.accentDark}"/>
     <text x="46" y="70" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="58" fill="#fff">S</text><circle cx="73" cy="30" r="7" fill="#f0a02a"/></svg>`;
  // Logo d'un réseau / moyen de paiement en tuile arrondie (repli : pastille de couleur + initiales)
  const tile = (p, size, extra = "") => p.logo
    ? `<img class="tile" src="${p.logo}" alt="${p.name}" style="width:${size}px;height:${size}px;border-radius:${size * .24}px;display:block;flex:none;object-fit:cover;box-shadow:0 0 0 2px rgba(0,0,0,.06);${extra}">`
    : `<span class="tile" style="width:${size}px;height:${size}px;border-radius:50%;background:${p.color};display:flex;align-items:center;justify-content:center;flex:none;color:#fff;font-weight:800;font-size:${size * .36}px;${extra}">${p.name.split(" ").map(w => w[0]).join("")}</span>`;
  const brandPill = (scale = 1) => `<div class="brand-pill" style="font-size:${54 * scale}px;padding:${12 * scale}px ${40 * scale}px ${12 * scale}px ${12 * scale}px;gap:${18 * scale}px"><span class="mark" style="width:${80 * scale}px;height:${80 * scale}px">${logoMark()}</span>${C.brand.name}</div>`;
  const avatar = () => C.persona.avatar ? `<img src="${C.persona.avatar}" alt="">` :
    `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="${C.colors.gold}"/><clipPath id="avc"><circle cx="100" cy="100" r="100"/></clipPath><g clip-path="url(#avc)">
      <ellipse cx="100" cy="205" rx="80" ry="55" fill="${C.colors.accent}"/><path d="M60 170 Q100 200 140 170 L140 210 L60 210Z" fill="${C.colors.accentDark}"/>
      <rect x="86" y="128" width="28" height="34" rx="8" fill="#5b331c"/><ellipse cx="100" cy="112" rx="35" ry="41" fill="#6e3f22"/>
      <path d="M60 104 Q56 44 100 40 Q146 38 142 100 Q132 74 100 74 Q70 74 60 104Z" fill="#ff7900"/>
      <path d="M68 58 Q96 6 138 54 Q118 30 96 34 Q78 38 68 58Z" fill="#ffa040"/><path d="M80 48 Q110 30 134 60" stroke="${C.colors.accentDark}" stroke-width="5" fill="none"/>
      <circle cx="66" cy="124" r="6" fill="${C.colors.gold}"/><circle cx="134" cy="124" r="6" fill="${C.colors.gold}"/>
      <ellipse cx="87" cy="112" rx="4" ry="5" fill="#1d0f07"/><ellipse cx="113" cy="112" rx="4" ry="5" fill="#1d0f07"/><path d="M88 131 Q100 140 112 131" stroke="#1d0f07" stroke-width="4" fill="none" stroke-linecap="round"/></g></svg>`;
  const personIcon = c => `<svg viewBox="0 0 24 24" width="60%" height="60%"><circle cx="12" cy="8" r="4.2" fill="${c}"/><path d="M3.5 21c.8-4.6 4.2-7 8.5-7s7.7 2.4 8.5 7z" fill="${c}"/></svg>`;
  const clock = c => `<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="13.5" r="8"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5M19 6l1.5-1.5"/></svg>`;
  const waIcon = `<svg viewBox="0 0 24 24" width="38" height="38"><path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5z" fill="#fff"/><path d="M8.6 7.3c.2-.4.5-.4.8-.4h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.6l-.6.7c-.1.1-.2.3 0 .5.4.7 1 1.4 1.6 1.9.7.6 1.4.9 1.7 1 .2.1.4 0 .5-.1l.7-.9c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.4.4 0 .3 0 1-.4 1.5-.4.5-1.3 1-2 1-.6 0-1.4.1-3.3-.8-2.2-1-3.7-3.3-3.8-3.5-.1-.2-.9-1.2-.9-2.3 0-1.1.6-1.7.8-1.9z" fill="#21c063"/></svg>`;
  const sendIcon = `<svg viewBox="0 0 24 24" width="40" height="40"><path d="M3 20.5 21 12 3 3.5l.01 6.6L15 12 3.01 13.9z" fill="#0b141a"/></svg>`;
  const ch = C.chat, total = ch.price + ch.fees;
  const pay = C.payMethods[C.chosenPay] || C.payMethods[0];
  const op = C.networks[0];
  // rangée de tuiles centrée
  function rowLayout(items, y, gap, lt, a, step) {
    const tw = items.reduce((s, n) => s + n.offsetWidth, 0) + gap * (items.length - 1);
    let x = (W - tw) / 2;
    items.forEach((n, i) => { tf(n, { x, y: y + Math.sin(lt * 2 + i) * 5, s: ease(lt, a + i * step, a + .35 + i * step, E.outBack), o: prog(lt, a + i * step, a + .1 + i * step) }); x += n.offsetWidth + gap; });
  }

  const scenes = [];
  let stage;
  function scene(start, end, build) {
    const root = el(`<div class="scene"></div>`);
    stage.appendChild(root);
    scenes.push({ start, end, root, update: build(root) });
  }
  const DURATION = T.end;

  // ═══════════════ BACKGROUND ═══════════════
  let bgPattern, bgGlow, fade;
  function buildBackground() {
    bgPattern = el(`<svg id="bg-pattern" width="${W + 400}" height="${H + 400}"><defs><pattern id="pt" width="180" height="180" patternUnits="userSpaceOnUse">
      <g fill="none" stroke="#fff" stroke-width="2"><circle cx="90" cy="90" r="18"/><circle cx="90" cy="90" r="38"/><circle cx="90" cy="90" r="58" stroke-dasharray="5 9"/>
      <path d="M0 0 Q40 45 0 90 M180 0 Q140 45 180 90 M0 180 Q40 135 0 90 M180 180 Q140 135 180 90"/></g>
      <circle cx="0" cy="0" r="5" fill="#fff"/><circle cx="180" cy="0" r="5" fill="#fff"/><circle cx="0" cy="180" r="5" fill="#fff"/><circle cx="180" cy="180" r="5" fill="#fff"/>
      </pattern></defs><rect width="100%" height="100%" fill="url(#pt)"/></svg>`);
    bgGlow = el(`<div id="bg-glow"></div>`);
    stage.append(bgPattern, bgGlow);
  }
  function updateBackground(t) {
    bgPattern.style.transform = `translate(${(t * 9) % 180}px, ${(t * 14) % 180}px)`;
    bgGlow.style.transform = `translate(${-200 + Math.sin(t * .3) * 260}px, ${-300 + Math.cos(t * .23) * 260}px)`;
  }

  // ═══════════════ 1. ACCROCHE ═══════════════
  function buildHook() {
    sfx(.05, "pop"); sfx(.3, "alert"); sfx(1.55, "whoosh");
    scene(T.hook, T.promise + .4, root => {
      const P = el(`<div class="abs" id="persona"><div class="avatar">${avatar()}</div><div>
        <div class="clip"><div class="pname">${C.persona.name}</div></div>
        <div class="clip"><div class="prole">${C.persona.role}</div></div></div></div>`);
      const alert = el(`<div class="abs alert"><div class="ai"><svg viewBox="0 0 24 24" width="56" height="56" fill="#fff"><path d="M12 2.8 1.8 20.5h20.4z" /><path d="M12 9v5.5M12 17.4v.2" stroke="${C.colors.danger}" stroke-width="2.6" stroke-linecap="round"/></svg></div>
        <div><div class="at">${C.hook.alertTitle}</div><div class="as">${C.hook.alertText}</div></div></div>`);
      const q = C.hook.question.map((l, i) => el(`<div class="abs clip"><div class="big ${i ? "g" : ""}" style="font-size:96px">${nb(l)}</div></div>`));
      root.append(P, alert, ...q);
      const av = $(P, ".avatar"), nm = $(P, ".pname"), rl = $(P, ".prole");
      let fitted = false;
      return lt => {
        if (!fitted) { q.forEach(e => fit(e.firstElementChild, 980)); fitted = true; }
        const out = ease(lt, 1.55, 2.05, E.inCubic);
        tf(av, { s: ease(lt, 0, .35, E.outBack), o: prog(lt, 0, .1) });
        tf(nm, { y: (1 - ease(lt, .05, .4)) * 170 });
        tf(rl, { y: (1 - ease(lt, .15, .5)) * 70 });
        const m = ease(lt, 1.5, 2.05, E.inOutCubic);
        tf(P, { x: lerp(cx(P), 40, m), y: lerp(250, 40, m), s: lerp(1, .3, m), o: 1 - prog(lt, 1.8, 2.05) });
        const d = ease(lt, .2, .55, E.outBack), shake = Math.sin(lt * 50) * 4 * bump(lt, .45, .85);
        tf(alert, { x: cx(alert) + shake, y: lerp(720, 920, d), rz: shake * .4, o: prog(lt, .2, .3) * (1 - out), s: 1 - .1 * out });
        q.forEach((e, i) => {
          tf(e, { x: cx(e), y: 1200 + i * 120, o: 1 - out });
          tf(e.firstElementChild, { y: (1 - ease(lt, .1 + i * .3, .5 + i * .3, E.outQuint)) * 130 });
        });
      };
    });
  }

  // ═══════════════ BADGE PERSONA (haut gauche) ═══════════════
  function buildBadge() {
    scene(T.promise, T.confirm, root => {
      const b = el(`<div class="abs" id="badge"><div class="avatar">${avatar()}</div><div><div class="bn">${C.persona.name}</div><div class="br">${C.persona.role}</div></div></div>`);
      root.append(b);
      return (lt, t) => tf(b, { x: 40, y: 44, o: prog(t, T.promise + .1, T.promise + .35) * (1 - prog(t, T.confirm - .4, T.confirm)) });
    });
  }

  // ═══════════════ 2. PROMESSE ═══════════════
  function buildPromise() {
    const s = T.promise;
    sfx(s + .2, "pop"); sfx(s + 1.9, "ding"); C.networks.forEach((_, i) => sfx(s + 2.8 + i * .15, "pop"));
    scene(s, T.chat + .6, root => {
      const logo = el(`<div class="abs">${brandPill(1.15)}</div>`);
      const lines = C.promise.lines.map(l => el(`<div class="abs clip"><div class="big" style="font-size:118px">${rich(l)}</div></div>`));
      const avail = el(`<div class="abs pill"><i style="background:#21c063"></i>${C.promise.available}</div>`);
      const nets = C.networks.map(n => el(`<div class="abs">${tile(n, 150, "box-shadow:0 20px 40px rgba(0,0,0,.35)")}</div>`));
      root.append(logo, ...lines, avail, ...nets);
      const ul = $(root, ".ul");
      let fitted = false;
      return lt => {
        if (!fitted) { lines.forEach(e => fit(e.firstElementChild, 1000)); fitted = true; }
        const out = ease(lt, 3.95, 4.45, E.inCubic);
        root.style.opacity = 1 - out;
        tf(logo, { x: cx(logo), y: 330 - out * 80, s: ease(lt, .15, .55, E.outBack) });
        lines.forEach((e, i) => {
          tf(e, { x: cx(e), y: 540 + i * 128 - out * 120 });
          tf(e.firstElementChild, { y: (1 - ease(lt, .35 + i * .12, .8 + i * .12, E.outQuint)) * 140 });
        });
        if (ul) ul.style.transform = `scaleX(${ease(lt, 1.85, 2.35, E.inOutCubic)})`;
        tf(avail, { x: cx(avail), y: 1240 + (1 - ease(lt, 2.4, 2.8)) * 40, o: prog(lt, 2.4, 2.6) });
        rowLayout(nets, 1360, 34, lt, 2.8, .15);
      };
    });
  }

  // ═══════════════ 3. CONVERSATION WHATSAPP ═══════════════
  function buildChat() {
    const s = T.chat;
    const tm = h => `<span class="tm">14:${h}</span>`, tmMe = h => `<span class="tm">14:${h}<b>✓✓</b></span>`;
    const btns = (...b) => `<div class="bt">${b.map(x => `<div>${x}</div>`).join("")}</div>`;
    // [temps d'apparition (s depuis le début de la scène), côté, contenu]
    const M = [
      [1.65, "me", `Bonjour Suura${tmMe(17)}`],
      [2.05, "in", `👋 <b>Bienvenue sur Suura</b> 🇨🇮<br><i class="it">La solution qui connecte l'Afrique</i><br><br>Que veux-tu faire ?${tm(17)}${btns("📦 Souscrire à un pass")}`],
      [2.8, "in", `📦 <b>Souscrire à un pass</b><br><br>📱 Quel numéro doit recevoir le pass ?${tm(17)}`],
      [4.0, "me", `${ch.number}${tmMe(17)}`],
      [4.35, "in", `✅ <b>Numéro confirmé :</b><br>${ch.number} · ${ch.operator}<br><br>Choisis ton pass :${tm(17)}${btns(`📶 ${ch.pass} · ${ch.passDetail}`, "📞 Pass Mixte")}`],
      [4.95, "me", `${ch.pass}<br>${ch.passDetail}${tmMe(18)}`],
      [5.25, "in", `🧾 <b>Récapitulatif</b><br><br>${ch.pass} · ${ch.passDetail}<br>📱 ${ch.number}<br>💰 Pass : ${fmt(ch.price)} FCFA<br>Frais : ${fmt(ch.fees)} FCFA<br><span class="tot">Total à payer : ${fmt(total)} FCFA</span>${tm(18)}${btns("💳 Payer maintenant")}`],
      [11.3, "in", `🎉 <b>Pass activé !</b><br>${ch.passDetail.split(" · ")[0]} ajoutés sur ${ch.number}<br>Merci d'utiliser Suura 💚${tm(18)}`],
    ];
    M.forEach(m => { m[2] = nb(m[2]); });
    const TAPS = [[2.55, 1, 0], [4.75, 4, 0], [5.75, 6, 0]]; // [temps, message, bouton]
    const TYPE = [[1.05, 1.5, "Bonjour Suura", 1.6], [3.15, 3.8, ch.number, 3.92]]; // [début, fin, texte, envoi]
    const SPOKEN = [6.4, 6.95, 7.85, 8.35, 8.85]; // moyens de paiement cités par la voix
    const PAY_TAP = 9.75, SHEET_IN = 5.95, SHEET_OUT = 10.85, STOP = 11.3;
    M.forEach(([a, side]) => sfx(s + a, side === "me" ? "send" : "pop"));
    TAPS.forEach(([a]) => sfx(s + a, "tap"));
    sfx(s, "whoosh"); sfx(s + SHEET_IN, "whoosh"); SPOKEN.forEach(a => sfx(s + a, "tick"));
    sfx(s + PAY_TAP, "tap"); sfx(s + 10.05, "ding"); sfx(s + SHEET_OUT, "whoosh"); sfx(s + 11.6, "notif"); sfx(s + 12.2, "whoosh");

    scene(s, T.confirm + .3, root => {
      const step = el(`<div class="abs step"><span class="sn">1</span><span class="st">${C.steps[0]}</span></div>`);
      const chrono = el(`<div class="abs chrono">${clock("#fff")}<span class="cv">00:00</span></div>`);
      const pm = C.payMethods.map(p => `<div class="pm">${tile(p, 68)}${p.name}<span class="chev">›</span></div>`).join("");
      const phone = el(`<div class="abs phone"><div class="screen">
        <div class="sb"><span>14:17</span><span>▂▄▆ 5G ▮</span></div>
        <div class="wa-head"><span style="font-size:36px">←</span><span class="mark">${logoMark()}</span><div><div class="hn">${C.brand.name}</div><div class="hs">Compte professionnel</div></div></div>
        <div class="chat"><div class="col">${M.map(([, side, h]) => `<div class="msg ${side}">${h}</div>`).join("")}</div></div>
        <div class="wa-input"><div class="box"><span class="tx"></span><span class="caret"></span><span class="ph">Message</span></div><div class="send">${sendIcon}</div></div>
        <div class="sheet"><div class="sh-top"><span class="mark">${logoMark()}</span><span class="sh-name">${C.brand.name}</span><div class="sh-amt"><small>MONTANT À PAYER</small><b>${fmt(total)} XOF</b></div></div>
          <h3>Payer avec</h3>${pm}
          <div class="paydone"><div class="pc">${check(C.colors.accent)}</div><b>Paiement réussi</b><span>${fmt(total)} FCFA via ${pay.name}</span></div></div>
        <div class="notif">${tile(op, 70)}<div><b>${ch.operator}</b><span>Vous avez reçu ${ch.passDetail.split(" · ")[0]} valables ${ch.passDetail.split(" · ")[1] || ""}.</span></div></div>
        <div class="tap"></div></div></div>`);
      root.append(phone, step, chrono);
      const screen = $(phone, ".screen"), chat = $(phone, ".chat"), col = $(phone, ".col"), msgs = $$(phone, ".msg");
      const tx = $(phone, ".tx"), caret = $(phone, ".caret"), ph = $(phone, ".ph"), sendB = $(phone, ".send");
      const sheet = $(phone, ".sheet"), rows = $$(sheet, ".pm"), done = $(sheet, ".paydone"), pc = $(done, ".pc"), ck = $(done, ".ck");
      const notif = $(phone, ".notif"), tap = $(phone, ".tap"), sn = $(step, ".sn"), st = $(step, ".st"), cv = $(chrono, ".cv");
      return lt => {
        // téléphone
        const e = ease(lt, 0, .8), out = ease(lt, 12.2, 12.7, E.inCubic);
        tf(phone, { x: 180, y: lerp(1900, 330, e) - out * 300, rx: (1 - e) * 25, ry: Math.sin(lt * .9) * 2.5, s: 1 - out * .25, o: 1 - out });
        // étapes + chrono
        const si = lt < TAPS[2][0] ? 0 : lt < STOP ? 1 : 2, sw = [0, TAPS[2][0], STOP][si];
        sn.textContent = si + 1; st.textContent = C.steps[si];
        tf(step, { x: 50, y: 190, s: si === 0 ? ease(lt, .4, .8, E.outBack) : 1 + .12 * bump(lt, sw, sw + .35), o: prog(lt, .4, .5) * (1 - out) });
        const sec = Math.round(prog(lt, 1.05, STOP) * ch.duration), stopped = lt >= STOP;
        cv.textContent = `00:${String(sec).padStart(2, "0")}`;
        chrono.style.background = stopped ? C.colors.gold : "";
        chrono.style.color = stopped ? C.colors.ink : "";
        $(chrono, "svg").setAttribute("stroke", stopped ? C.colors.ink : "#fff");
        tf(chrono, { x: W - 50 - chrono.offsetWidth, y: 190, s: ease(lt, .5, .9, E.outBack) * (1 + .15 * bump(lt, STOP, STOP + .4)), o: prog(lt, .5, .6) * (1 - out) });
        // messages + défilement
        const viewH = chat.offsetHeight;
        let bottom = 0;
        msgs.forEach((m, i) => {
          const a = M[i][0], k = ease(lt, a, a + .3, E.outBack);
          tf(m, { s: lt < a ? .6 : .85 + .15 * k, o: prog(lt, a, a + .1) });
          if (lt >= a) bottom = lerp(bottom, m.offsetTop + m.offsetHeight + 24, ease(lt, a, a + .3, E.inOutCubic));
        });
        const scroll = Math.max(0, bottom - viewH);
        col.style.transform = `translateY(${-scroll}px)`;
        // saisie
        const ty = TYPE.find(([a, , , snd]) => lt >= a - .1 && lt < snd + .05);
        if (ty) {
          const n = Math.floor(prog(lt, ty[0], ty[1]) * ty[2].length);
          tx.textContent = ty[2].slice(0, n); ph.style.display = n ? "none" : "";
          caret.style.display = Math.floor(lt * 5) % 2 === 0 || n ? "" : "none";
        } else { tx.textContent = ""; ph.style.display = ""; caret.style.display = "none"; }
        tf(sendB, { s: 1 + .2 * TYPE.reduce((a, [, , , snd]) => a + bump(lt, snd - .1, snd + .15), 0) });
        // feuille de paiement : chaque moyen s'allume quand la voix le cite
        const sh = ease(lt, SHEET_IN, SHEET_IN + .45, E.outCubic) * (1 - ease(lt, SHEET_OUT, SHEET_OUT + .4, E.inCubic));
        tf(sheet, { y: (1 - sh) * 1100, o: sh > 0 ? 1 : 0 });
        rows.forEach((r, i) => {
          const hi = bump(lt, SPOKEN[i] ?? 99, (SPOKEN[i] ?? 99) + .5), chosen = i === C.chosenPay && lt > PAY_TAP;
          r.style.borderColor = chosen || hi > .2 ? C.payMethods[i].color : "";
          r.style.background = hi > .2 ? `color-mix(in srgb, ${C.payMethods[i].color} 10%, #fff)` : "";
          tf(r, { y: (1 - ease(lt, SHEET_IN + .15 + i * .06, SHEET_IN + .45 + i * .06)) * 40, s: 1 + .04 * hi, o: prog(lt, SHEET_IN + .15 + i * .06, SHEET_IN + .3 + i * .06) });
        });
        tf(done, { o: prog(lt, 10.0, 10.15) });
        tf(pc, { s: ease(lt, 10.0, 10.35, E.outBack) });
        ck.setAttribute("stroke-dashoffset", 1 - ease(lt, 10.2, 10.5));
        // notification opérateur
        const nf = ease(lt, 11.6, 12.0, E.outBack) * (1 - ease(lt, 12.4, 12.7));
        tf(notif, { y: lerp(-200, 0, nf), o: nf > 0 ? 1 : 0 });
        // tapotements
        let tapPos = null, tp = 0;
        for (const [a, mi, bi] of TAPS) if (lt >= a - .05 && lt < a + .4) { const c = center($$(msgs[mi], ".bt div")[bi], screen); tapPos = { x: c.x, y: c.y - scroll }; tp = prog(lt, a - .05, a + .4); }
        for (const [, , , snd] of TYPE) if (lt >= snd - .1 && lt < snd + .3) { tapPos = center(sendB, screen); tp = prog(lt, snd - .1, snd + .3); }
        if (lt >= PAY_TAP - .05 && lt < PAY_TAP + .4) { tapPos = center(rows[C.chosenPay], screen); tp = prog(lt, PAY_TAP - .05, PAY_TAP + .4); }
        if (tapPos) { tap.style.left = tapPos.x + "px"; tap.style.top = tapPos.y + "px"; tf(tap, { s: .5 + tp * .9, o: 1 - tp }); } else tf(tap, { o: 0 });
      };
    });
  }

  // ═══════════════ 4. CONFIRMATION ═══════════════
  function buildConfirm() {
    const s = T.confirm;
    sfx(s + .1, "success"); sfx(s + .45, "confetti");
    scene(s, T.feats[0] + .3, root => {
      const X = W / 2, Y = 640;
      const rings = [0, 1, 2].map(() => el(`<div class="abs ring"></div>`));
      const R = rng(11), cols = [C.colors.accent, C.colors.gold, "#ffffff", "#ff7900", "#0066b3", "#ffcb05"];
      const conf = Array.from({ length: 90 }, () => {
        const a = R() * Math.PI * 2, v = 500 + R() * 1000;
        const d = el(`<div class="confetti" style="width:${10 + R() * 12}px;height:${6 + R() * 7}px;background:${cols[Math.floor(R() * cols.length)]}"></div>`);
        return { d, a, v, spin: (R() - .5) * 900, delay: R() * .12 };
      });
      const big = el(`<div class="abs big-check">${check(C.colors.accent)}</div>`);
      const title = el(`<div class="abs clip"><div class="big" style="font-size:130px">${nb(C.confirm.title)}</div></div>`);
      const sub = el(`<div class="abs big g" style="font-size:72px;color:var(--gold)">${C.confirm.sub}</div>`);
      const chrono = el(`<div class="abs chrono" style="background:var(--gold);color:var(--ink)">${clock(C.colors.ink)}${ch.duration} secondes chrono</div>`);
      root.append(...rings, ...conf.map(c => c.d), big, title, sub, chrono);
      const ck = $(big, ".ck");
      let fitted = false;
      return lt => {
        if (!fitted) { fit(sub, 1000); fitted = true; }
        const out = prog(lt, 1.95, 2.35);
        root.style.opacity = 1 - out;
        tf(big, { x: X - 180, y: Y - 180, s: ease(lt, .05, .45, E.outBack) * (1 - .15 * out), o: prog(lt, .05, .2) });
        ck.setAttribute("stroke-dashoffset", 1 - ease(lt, .3, .6));
        rings.forEach((r, i) => { const p = prog(lt, .35 + i * .2, 1.5 + i * .2); tf(r, { x: X - 180, y: Y - 180, s: 1 + E.outCubic(p) * 1.5, o: p > 0 ? (1 - p) * .7 : 0 }); });
        conf.forEach(c => {
          const tt = Math.max(0, lt - .4 - c.delay), dr = (1 - Math.exp(-3 * tt)) / 3;
          tf(c.d, { x: X + Math.cos(c.a) * c.v * dr, y: Y + Math.sin(c.a) * c.v * dr + 420 * tt * tt, rz: c.spin * tt, ry: c.spin * tt * .7, o: tt > 0 ? 1 - prog(tt, 1.1, 1.6) : 0 });
        });
        tf(title, { x: cx(title), y: 960 });
        tf(title.firstElementChild, { y: (1 - ease(lt, .2, .55, E.outQuint)) * 160 });
        tf(sub, { x: cx(sub), y: 1130 + (1 - ease(lt, .9, 1.3)) * 40, o: prog(lt, .9, 1.1) });
        tf(chrono, { x: cx(chrono), y: 1290, s: ease(lt, 1.35, 1.7, E.outBack), o: prog(lt, 1.35, 1.45) });
      };
    });
  }

  // ═══════════════ 5. POURQUOI SUURA ═══════════════
  const VIS = {
    instant(v) {
      const steps = [["Paiement confirmé", "0,0 s"], ["Crédit envoyé", "+0,4 s"], [`Reçu sur ${ch.number}`, "+0,9 s"]];
      v.innerHTML = `<div class="abs bolt" style="width:170px;height:170px;border-radius:50%;background:${C.colors.gold};display:flex;align-items:center;justify-content:center;box-shadow:0 20px 50px rgba(245,197,24,.45)">
        <svg viewBox="0 0 24 24" width="96" height="96"><path d="M13.5 2 4.5 13.5H11L10 22l9-11.5h-6.5z" fill="${C.colors.ink}"/></svg></div>
        <div class="abs line" style="left:146px;top:330px;width:6px;height:330px;background:#d9e7de;border-radius:3px"><div class="fill" style="width:100%;height:100%;background:${C.colors.accent};transform-origin:50% 0"></div></div>
        ${steps.map(([a, b]) => `<div class="ui row stp" style="width:700px;height:120px;padding:0 34px;font-size:34px;font-weight:800"><span class="cc" style="width:64px;height:64px;flex:none">${check(C.colors.accent)}</span>${a}<span style="margin-left:auto;font-size:28px;color:${C.colors.accent}">${b}</span></div>`).join("")}`;
      const bolt = $(v, ".bolt"), fill = $(v, ".fill"), st = $$(v, ".stp");
      return lt => {
        tf(bolt, { x: 355, y: 70, s: ease(lt, .1, .5, E.outBack), rz: Math.sin(lt * 9) * 6 * bump(lt, .4, 1.0) });
        fill.style.transform = `scaleY(${ease(lt, .6, 1.6, E.inOutCubic)})`;
        st.forEach((r, i) => { tf(r, { x: 90, y: 300 + i * 160 + (1 - ease(lt, .35 + i * .3, .7 + i * .3)) * 40, o: prog(lt, .35 + i * .3, .5 + i * .3) }); tf($(r, ".cc"), { s: ease(lt, .5 + i * .3, .8 + i * .3, E.outBack) }); });
      };
    },
    networks(v) {
      const P = [[70, 80], [610, 80], [340, 555]];
      v.innerHTML = `<svg class="abs" width="880" height="780">${P.map(([x, y]) => `<path class="ln" d="M440 400 L${x + 100} ${y + 100}" stroke="${C.colors.accent}" stroke-width="6" stroke-dasharray="14 12" fill="none"/>`).join("")}</svg>
        <div class="abs hub" style="width:230px;height:230px;filter:drop-shadow(0 20px 30px rgba(0,0,0,.2))">${logoMark()}</div>
        ${C.networks.map(n => `<div class="abs nb">${tile(n, 200, "box-shadow:0 24px 50px rgba(0,0,0,.2)")}</div>`).join("")}
        ${C.networks.map(() => `<div class="abs pk" style="width:26px;height:26px;border-radius:50%;background:${C.colors.gold};box-shadow:0 0 18px ${C.colors.gold}"></div>`).join("")}`;
      $(v, ".hub img")?.style.setProperty("width", "100%");
      const hub = $(v, ".hub"), bs = $$(v, ".nb"), lns = $$(v, ".ln"), pks = $$(v, ".pk");
      return lt => {
        tf(hub, { x: 325, y: 285, s: ease(lt, 0, .4, E.outBack) * (1 + .05 * Math.sin(lt * 4)) });
        bs.forEach((b, i) => tf(b, { x: P[i][0], y: P[i][1] + Math.sin(lt * 2 + i) * 8, s: ease(lt, .2 + i * .45, .55 + i * .45, E.outBack) }));
        lns.forEach((l, i) => l.style.opacity = prog(lt, .35 + i * .45, .55 + i * .45));
        pks.forEach((p, i) => { const t0 = 1.6 + i * .25, q = ((lt - t0) % .9 + .9) % .9 / .9; tf(p, { x: lerp(427, P[i][0] + 87, q), y: lerp(387, P[i][1] + 87, q), o: lt > t0 ? bump(q, 0, 1) : 0 }); });
      };
    },
    momo(v) {
      v.innerHTML = `<div class="ui list" style="width:700px;padding:22px 30px">${C.payMethods.map(p => `<div class="row" style="height:96px;font-size:32px;font-weight:800;border-bottom:2px solid #eef1ec">
        ${tile(p, 64)}${p.name}<span class="ok" style="margin-left:auto;width:50px;height:50px">${check(C.colors.accent)}</span></div>`).join("")}</div>
        <div class="abs nocard" style="display:inline-flex;align-items:center;gap:14px;background:${C.colors.ink};color:#fff;border-radius:99px;padding:18px 32px;font-size:30px;font-weight:800;white-space:nowrap">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="${C.colors.gold}" stroke-width="2.2"><rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M2.5 10h19M4 20 20 4" stroke-linecap="round"/></svg>Aucune carte bancaire</div>`;
      const list = $(v, ".list"), rows = $$(v, ".row"), nc = $(v, ".nocard");
      return lt => {
        tf(list, { x: 90, y: 30 + (1 - ease(lt, .05, .4)) * 60, o: prog(lt, .05, .2) });
        rows.forEach((r, i) => { tf(r, { x: (1 - ease(lt, .15 + i * .06, .45 + i * .06)) * 40, o: prog(lt, .15 + i * .06, .3 + i * .06) }); tf($(r, ".ok"), { s: ease(lt, .45 + i * .1, .7 + i * .1, E.outBack) }); });
        tf(nc, { x: (880 - nc.offsetWidth) / 2, y: 640, s: ease(lt, .5, .85, E.outBack), o: prog(lt, .5, .6) });
      };
    },
    proche(v) {
      const p = C.proche;
      v.innerHTML = `<svg class="abs" width="880" height="780"><path class="arc" d="M 250 270 Q 440 60 630 270" fill="none" stroke="${C.colors.accent}" stroke-width="6" stroke-dasharray="14 12"/></svg>
        <div class="abs av1" style="width:200px;height:200px;border-radius:50%;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,.15)">${avatar()}</div>
        <div class="abs av2" style="width:200px;height:200px;border-radius:50%;background:${C.colors.accentDark};display:flex;align-items:center;justify-content:center;box-shadow:0 20px 40px rgba(0,0,0,.15)">${personIcon("#fff")}</div>
        <div class="abs" style="left:60px;top:400px;width:300px;text-align:center;font-size:34px;font-weight:800">Toi<div style="font-size:26px;color:#6b7a70;font-weight:600">Abidjan</div></div>
        <div class="abs" style="left:520px;top:400px;width:300px;text-align:center;font-size:34px;font-weight:800">${p.name}<div style="font-size:26px;color:#6b7a70;font-weight:600">${p.city}</div></div>
        <div class="abs coin" style="background:${C.colors.gold};color:${C.colors.ink};border-radius:99px;padding:12px 24px;font-size:30px;font-weight:800;white-space:nowrap;box-shadow:0 10px 30px rgba(245,197,24,.5)">+${p.amount}</div>
        <div class="ui row rec" style="width:720px;height:150px;padding:0 34px;font-size:30px;font-weight:700"><span style="width:76px;height:76px;flex:none">${check(C.colors.accent)}</span><div><b style="font-size:34px">${p.name} a reçu ${p.amount}</b><div style="color:#6b7a70;font-size:26px">de crédit, grâce à toi</div></div></div>`;
      const a1 = $(v, ".av1"), a2 = $(v, ".av2"), arc = $(v, ".arc"), coin = $(v, ".coin"), rec = $(v, ".rec");
      return lt => {
        tf(a1, { x: 110, y: 170, s: ease(lt, .1, .45, E.outBack) });
        tf(a2, { x: 570, y: 170, s: ease(lt, .25, .6, E.outBack) * (1 + .12 * bump(lt, 1.6, 1.9)) });
        arc.style.opacity = prog(lt, .4, .6);
        const q = ease(lt, .7, 1.6, E.inOutCubic), pt = arc.getPointAtLength(q * arc.getTotalLength());
        tf(coin, { x: pt.x - coin.offsetWidth / 2, y: pt.y - 30, o: prog(lt, .7, .8) * (1 - prog(lt, 1.6, 1.7)) });
        tf(rec, { x: 80, y: 560 + (1 - ease(lt, 1.65, 2.05, E.outBack)) * 60, o: prog(lt, 1.65, 1.8) });
      };
    },
  };

  function buildFeatures() {
    const F = T.feats, NF = C.features.length, end = i => (i + 1 < NF ? F[i + 1] : T.stats);
    F.forEach(f => { sfx(f, "whoosh"); sfx(f + .45, "pop"); });
    scene(F[0] - .2, T.stats + .4, root => {
      const label = el(`<div class="abs f-label">${C.featuresLabel}</div>`);
      const dashes = el(`<div class="abs dashes">${"<i></i>".repeat(NF)}</div>`);
      root.append(label, dashes);
      const ds = $$(dashes, "i");
      return (lt, t) => {
        const o = prog(t, F[0] - .2, F[0] + .3) * (1 - prog(t, T.stats, T.stats + .35));
        tf(label, { x: 90, y: 170, o });
        tf(dashes, { x: 90, y: 860, o });
        ds.forEach((d, i) => {
          const a = prog(t, F[i] - .1, F[i] + .25) * (i === NF - 1 ? 1 : 1 - prog(t, end(i) - .1, end(i) + .25));
          d.style.width = 36 + 40 * a + "px";
          d.style.background = a > .5 ? C.colors.gold : "rgba(255,255,255,.22)";
        });
      };
    });
    C.features.forEach((f, i) => {
      const D = end(i) - F[i];
      scene(F[i], end(i) + .35, root => {
        const num = el(`<div class="abs clip" style="height:215px"><div style="display:flex;align-items:baseline;gap:20px"><span class="f-num">${String(i + 1).padStart(2, "0")}</span><span class="f-of">/${String(NF).padStart(2, "0")}</span></div></div>`);
        const title = el(`<div class="abs clip"><div class="f-title">${f.title}</div></div>`);
        const sub = el(`<div class="abs f-sub">${nb(f.sub)}<br><span class="hl">${nb(f.hl)}</span></div>`);
        const card = el(`<div class="abs fcard"><div class="vis"></div></div>`);
        root.append(num, title, sub, card);
        const ni = num.firstElementChild, ti = title.firstElementChild;
        const upd = (VIS[f.visual] || VIS.instant)($(card, ".vis"));
        let fitted = false;
        return (lt, t) => {
          if (!fitted) { fit(ti, 900); fitted = true; }
          const q = ease(lt, D - .05, D + .3, E.inCubic);
          tf(num, { x: 90, y: 225 });
          tf(ni, { y: (1 - ease(lt, 0, .5, E.outQuint)) * 220 - q * 220 });
          tf(title, { x: 90, y: 450 });
          tf(ti, { y: (1 - ease(lt, .08, .55, E.outQuint)) * 120 - q * 120 });
          tf(sub, { x: 90, y: 580 + (1 - ease(lt, .16, .6)) * 30 - q * 30, o: prog(lt, .16, .4) * (1 - q) });
          const e = ease(lt, 0, .6);
          tf(card, {
            x: 100 + (1 - e) * 700 - q * 900, y: 960 + Math.sin(t * 1.1) * 8,
            z: -(1 - e) * 400 - q * 300, ry: -8 - (1 - e) * 45 + q * 45 + Math.sin(t * 1.3) * 2, rx: 3,
            o: prog(lt, 0, .2) * (1 - q), blur: (1 - e) * 10 + q * 12,
          });
          upd(lt);
        };
      });
    });
  }

  // ═══════════════ 6. CHIFFRES ═══════════════
  function buildStats() {
    const s = T.stats, AT = [.9, 1.6, 3.0];
    sfx(s + .1, "whoosh"); AT.forEach(a => sfx(s + a, "pop"));
    scene(s, T.outro + .4, root => {
      const head = el(`<div class="abs clip"><div class="big" style="font-size:96px">Simple comme<br><span class="g">un message.</span></div></div>`);
      const cards = C.stats.map(st => el(`<div class="abs stat"><b>${st.value}</b><span>${st.label}</span></div>`));
      root.append(head, ...cards);
      return lt => {
        const out = ease(lt, 4.35, 4.75, E.inCubic);
        root.style.opacity = 1 - out;
        tf(head, { x: cx(head), y: 220 - out * 60 });
        tf(head.firstElementChild, { y: (1 - ease(lt, .1, .55, E.outQuint)) * 260 });
        cards.forEach((c, i) => {
          const a = AT[i] ?? 1 + i * .5, e = ease(lt, a, a + .5, E.outCubic);
          tf(c, { x: 110 + (1 - e) * 900, y: 640 + i * 340, ry: -(1 - e) * 40, o: prog(lt, a, a + .2) });
          const b = $(c, "b"), v = C.stats[i].value;
          b.textContent = /^\d+$/.test(v) ? Math.round(+v * ease(lt, a, a + .6)) : v.slice(0, Math.ceil(prog(lt, a, a + .5) * v.length)) || " ";
        });
      };
    });
  }

  // ═══════════════ 7. FIN ═══════════════
  function buildOutro() {
    const s = T.outro;
    sfx(s + .2, "success"); sfx(s + 2.35, "pop");
    scene(s, DURATION, root => {
      const rings = [0, 1].map(() => el(`<div class="abs ring" style="border-color:rgba(255,255,255,.15)"></div>`));
      const logo = el(`<div class="abs">${brandPill(1.5)}</div>`);
      const tag = el(`<div class="abs tagline">${C.brand.tagline}</div>`);
      const cta = el(`<div class="abs cta"><span class="wa">${waIcon}</span>${C.brand.cta}</div>`);
      const sub = el(`<div class="abs sub2">${C.brand.ctaSub}</div>`);
      const nets = C.networks.map(n => el(`<div class="abs">${tile(n, 120, "box-shadow:0 16px 34px rgba(0,0,0,.3)")}</div>`));
      const pays = C.payMethods.map(p => el(`<div class="abs">${tile(p, 96, "box-shadow:0 14px 30px rgba(0,0,0,.3)")}</div>`));
      const url = el(`<div class="abs url">${C.brand.url}</div>`);
      root.append(...rings, logo, tag, ...nets, ...pays, cta, sub, url);
      let fitted = false;
      return lt => {
        if (!fitted) { fit(tag, 980); fit(cta, 1000); fitted = true; }
        rings.forEach((r, i) => { const p = prog(lt, .2 + i * .4, 2.7 + i * .4); tf(r, { x: W / 2 - 180, y: 480 - 180, s: 1 + p * 3, o: p > 0 ? (1 - p) * .8 : 0 }); });
        tf(logo, { x: cx(logo), y: 400, s: ease(lt, .15, .6, E.outBack), o: prog(lt, .15, .3) });
        tf(tag, { x: cx(tag), y: 620 + (1 - ease(lt, .55, .95)) * 40, o: prog(lt, .55, .8) });
        rowLayout(nets, 790, 30, lt, 1.0, .12);
        rowLayout(pays, 950, 24, lt, 1.35, .08);
        tf(cta, { x: cx(cta), y: 1140, s: ease(lt, 2.3, 2.7, E.outBack) * (1 + .03 * Math.sin(lt * 5) * prog(lt, 2.9, 3.2)), o: prog(lt, 2.3, 2.45) });
        tf(sub, { x: cx(sub), y: 1300 + (1 - ease(lt, 2.6, 3.0)) * 30, o: prog(lt, 2.6, 2.85) });
        tf(url, { x: cx(url), y: 1420 + (1 - ease(lt, 2.9, 3.3)) * 30, o: prog(lt, 2.9, 3.15) });
      };
    });
  }

  // ═══════════════ API ═══════════════
  window.MD = {
    duration: DURATION,
    fps: C.fps,
    sfx: SFX,
    init(stageEl) {
      stage = stageEl;
      for (const [k, v] of Object.entries(C.colors)) stage.style.setProperty("--" + k, v);
      buildBackground();
      buildHook(); buildPromise(); buildChat(); buildBadge(); buildConfirm(); buildFeatures(); buildStats(); buildOutro();
      stage.append(el(`<div id="vignette"></div>`));
      fade = el(`<div id="fade"></div>`);
      stage.append(fade);
      SFX.sort((a, b) => a.t - b.t);
    },
    renderAt(t) {
      updateBackground(t);
      for (const s of scenes) {
        const on = t >= s.start && t <= s.end;
        s.root.style.display = on ? "block" : "none";
        if (on) s.update(t - s.start, t);
      }
      fade.style.opacity = Math.max(1 - prog(t, 0, .2), prog(t, DURATION - .6, DURATION));
    },
  };
})();
