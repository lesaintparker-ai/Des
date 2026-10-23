// Rend des images d'aperçu aux instants clés : node scripts/apercus.mjs <dossier> <t1,t2,...>
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const [outDir, times] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('../projet/medias')});
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const composition = await selectComposition({serveUrl, id: 'BrunchEntreAmis', browserExecutable});
for (const t of times.split(',').map(Number)) {
	const frame = Math.round(t * composition.fps);
	const output = path.join(outDir, `t${String(t).replace('.', '_')}.jpg`);
	await renderStill({composition, serveUrl, frame, output, imageFormat: 'jpeg', browserExecutable, scale: 0.5});
	console.log(output);
}
