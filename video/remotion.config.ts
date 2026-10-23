import {Config} from '@remotion/cli/config';

// Les médias du projet (photos, vidéos, audio) sont servis depuis projet/medias.
Config.setPublicDir('../projet/medias');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setAudioCodec('aac');
Config.setOverwriteOutput(true);
Config.setConcurrency(4);

// Navigateur préinstallé dans l'environnement (évite un téléchargement).
// Supprimer cette ligne sur une machine où Remotion peut télécharger son navigateur.
if (process.env.REMOTION_BROWSER) {
	Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
