// Rendu MP4 image par image.
//   node render.mjs                      → out/suura-motion.mp4 (vidéo + bruitages)
//   node render.mjs --no-audio           → vidéo muette
//   node render.mjs --no-voice           → bruitages seuls, sans la voix off
//   node render.mjs --frames 2,8.5,30    → captures PNG à ces instants (contrôle visuel)
//   node render.mjs --from 6 --to 12     → rendu partiel
import { createRequire } from "node:module";
import { spawn, execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); }
catch { playwright = require(path.join(execSync("npm root -g").toString().trim(), "playwright")); }

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(opt("--out", path.join(dir, "out", "suura-motion.mp4")));
fs.mkdirSync(path.dirname(out), { recursive: true });

const launch = { args: ["--allow-file-access-from-files"] };
if (fs.existsSync("/opt/pw-browsers/chromium")) launch.executablePath = "/opt/pw-browsers/chromium";
let browser;
try { browser = await playwright.chromium.launch(launch); }
catch { delete launch.executablePath; browser = await playwright.chromium.launch(launch); }

const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on("pageerror", e => console.error("Erreur page :", e.message));
await page.goto(pathToFileURL(path.join(dir, "index.html")).href + "?render=1");
await page.waitForFunction(() => window.MD_READY === true);
const { duration, fps, w, h, sfx, voice } = await page.evaluate(() => ({ duration: MD.duration, fps: MD.fps, w: MD_CONFIG.width, h: MD_CONFIG.height, sfx: MD.sfx, voice: MD_CONFIG.voice || null }));
await page.setViewportSize({ width: w, height: h });
const stage = await page.$("#stage");

const shots = opt("--frames");
if (shots) {
  for (const t of shots.split(",").map(Number)) {
    await page.evaluate(t => MD.renderAt(t), t);
    const file = path.join(path.dirname(out), `frame_${t.toFixed(2).padStart(5, "0")}.png`);
    await stage.screenshot({ path: file });
    console.log(file);
  }
  await browser.close();
  process.exit(0);
}

const from = Number(opt("--from", 0)), to = Math.min(Number(opt("--to", duration)), duration);
const total = Math.round((to - from) * fps);

// ── Audio : voix off + bruitages synthétisés (pop, whoosh, ding…) calés sur les animations ──
let audioArgs = [];
if (!args.includes("--no-audio")) {
  const wav = path.join(path.dirname(out), "sfx.wav");
  writeWav(wav, synth(sfx.filter(s => s.t >= from && s.t < to).map(s => ({ ...s, t: s.t - from })), to - from));
  const voiceFile = voice?.file && !args.includes("--no-voice") ? path.join(dir, voice.file) : null;
  if (voiceFile && fs.existsSync(voiceFile)) {
    audioArgs = ["-i", wav, "-ss", String(from), "-i", voiceFile, "-filter_complex",
      `[1:a]volume=${voice.sfxVolume ?? .35}[s];[2:a]volume=${voice.volume ?? 1},apad[v];[v][s]amix=inputs=2:duration=shortest:normalize=0,alimiter=limit=0.95[a]`,
      "-map", "0:v", "-map", "[a]", "-c:a", "aac", "-b:a", "192k", "-shortest"];
  } else {
    audioArgs = ["-i", wav, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "192k", "-shortest"];
  }
}

const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-", ...audioArgs,
  "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out],
  { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((res, rej) => ff.on("close", c => (c === 0 ? res() : rej(new Error("ffmpeg code " + c)))));

const t0 = Date.now();
for (let f = 0; f < total; f++) {
  await page.evaluate(t => MD.renderAt(t), from + f / fps);
  const buf = await stage.screenshot({ type: "png" });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
  if (f % 60 === 0) process.stdout.write(`\r${f}/${total} images (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
ff.stdin.end();
await done;
await browser.close();
console.log(`\nOK → ${out}`);

// ───────────────────────────────────────────────────────────────
function synth(events, dur) {
  const SR = 48000, buf = new Float32Array(Math.ceil((dur + 1) * SR));
  let seed = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const add = (t0, len, fn) => { const s0 = Math.round(t0 * SR); for (let i = 0; i < len * SR && s0 + i < buf.length; i++) if (s0 + i >= 0) buf[s0 + i] += fn(i / SR); };
  const tone = (t0, f0, f1, len, amp, decay = 30) => { let ph = 0; add(t0, len, t => { const f = f0 + (f1 - f0) * (t / len); ph += 2 * Math.PI * f / SR; return Math.sin(ph) * amp * Math.exp(-t * decay) * Math.min(1, t * 400); }); };
  const S = {
    pop: t => tone(t, 620, 1150, .09, .32, 40),
    send: t => tone(t, 480, 900, .07, .22, 45),
    tick: t => tone(t, 1500, 1700, .05, .14, 60),
    tap: t => { add(t, .02, () => rnd() * .18); tone(t, 1900, 1500, .04, .12, 90); },
    whoosh: t => { let lp = 0; add(t, .45, x => { const p = x / .45, a = .55 * Math.sin(Math.PI * p) ** 2, c = .02 + .25 * Math.sin(Math.PI * p); lp += c * (rnd() - lp); return lp * a; }); },
    ding: t => { tone(t, 1318.5, 1318.5, 1.1, .22, 4.5); tone(t, 1975.5, 1975.5, 1.1, .1, 6); },
    success: t => [784, 988, 1175, 1568].forEach((f, i) => tone(t + i * .08, f, f, .6, .18, 7)),
    notif: t => { tone(t, 880, 880, .25, .2, 12); tone(t + .13, 1320, 1320, .35, .2, 9); },
    alert: t => [0, .16].forEach(d => { let ph = 0; add(t + d, .12, x => { ph += 2 * Math.PI * 330 / SR; return (Math.sin(ph) + .3 * Math.sin(3 * ph)) * .16 * Math.min(1, (.12 - x) * 60); }); }),
    confetti: t => { for (let i = 0; i < 18; i++) { const d = Math.abs(rnd()) * .7; add(t + d, .012, () => rnd() * .08); } },
  };
  for (const e of events) (S[e.type] || S.pop)(e.t);
  return buf;
}
function writeWav(file, data) {
  const SR = 48000, n = data.length, b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i] * .9)) * 32767), 44 + i * 2);
  fs.writeFileSync(file, b);
}
