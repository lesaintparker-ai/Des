// Rendu vidéo réel : Chromium (sans interface) dessine chaque image, FFmpeg encode le MP4.
// Flou de mouvement : 4 sous-images par image (obturateur 180°), moyennées par FFmpeg.
// Usage : node render.js h|v sortie.mp4
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const fmt = process.argv[2] === "v" ? "v" : "h";
const out = path.resolve(process.argv[3] || `out/a-la-decouverte_${fmt === "v" ? "9x16" : "16x9"}.mp4`);
const audio = path.join(__dirname, "audio", "jingle.wav");
const SUB = 4;

(async () => {
  if (!fs.existsSync(audio)) throw new Error("audio/jingle.wav manquant : lancez d'abord « npm run audio »");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const [W, H] = fmt === "v" ? [1080, 1920] : [1920, 1080];
  const browser = await chromium.launch(
    fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {}
  );
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on("pageerror", (e) => {
    console.error("Erreur page :", e.message);
    process.exit(1);
  });
  await page.goto("file://" + path.join(__dirname, "src", "index.html") + "?format=" + fmt);
  const info = await page.evaluate(async () => {
    await window.JINGLE.ready;
    return { fps: window.JINGLE.fps, duration: window.JINGLE.duration };
  });
  const frames = Math.round(info.fps * info.duration);

  const ff = spawn("ffmpeg", [
    "-v", "error", "-y",
    "-f", "image2pipe", "-framerate", String(info.fps * SUB), "-i", "-",
    "-i", audio,
    "-filter_complex",
    `[0:v]tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/(${info.fps}*TB),` +
      "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]",
    "-map", "[v]", "-map", "1:a",
    "-r", String(info.fps),
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-profile:v", "high",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    "-c:a", "aac", "-b:a", "256k",
    "-t", String(info.duration),
    "-movflags", "+faststart",
    out,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("FFmpeg code " + c)))));

  const t0 = Date.now();
  for (let n = 0; n < frames; n++) {
    for (let k = 0; k < SUB; k++) {
      // sous-images réparties sur une demi-image, centrées sur l'instant n/fps
      const t = Math.max(0, (n + (k - (SUB - 1) / 2) / (2 * SUB)) / info.fps);
      await page.evaluate((t) => window.JINGLE.render(t), t);
      const buf = await page.screenshot({ type: "png" });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    }
    if (n % 25 === 0) process.stdout.write(`image ${n}/${frames} (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
  }
  ff.stdin.end();
  await done;
  await browser.close();
  console.log("Écrit :", out);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
