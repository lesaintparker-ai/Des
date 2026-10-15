// Images clés + planche contact pour vérifier la mise en page sans rendre toute la vidéo.
// Usage : node stills.js [h|v] [t1,t2,...] [dossier]
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const fmt = process.argv[2] || "h";
const times = (process.argv[3] || "0.1,0.4,1.0,1.46,1.9,2.8,3.7,4.6,5.3,5.9,6.4,6.75,7.1,7.42,8.1,9.5")
  .split(",")
  .map(Number);
const outDir = process.argv[4] || path.join(__dirname, "out", "stills");

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const [W, H] = fmt === "v" ? [1080, 1920] : [1920, 1080];
  const browser = await chromium.launch(
    fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {}
  );
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on("pageerror", (e) => console.error("Erreur page :", e.message));
  await page.goto("file://" + path.join(__dirname, "src", "index.html") + "?format=" + fmt);
  await page.evaluate(() => window.JINGLE.ready);
  for (const t of times) {
    await page.evaluate((t) => window.JINGLE.render(t), t);
    const f = path.join(outDir, `${fmt}_${t.toFixed(2)}.png`);
    await page.screenshot({ path: f });
    console.log(f);
  }
  await browser.close();
})();
