import '@fontsource/anton/400.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/800.css';
import React from 'react';
import {Composition, continueRender, delayRender} from 'remotion';
import {DURATION_S} from './config/content';
import {VIDEO} from './config/theme';
import {BrunchVideo} from './Video';

// Attendre le chargement des polices avant le rendu des images.
const fontsHandle = delayRender('Chargement des polices');
Promise.all([
	document.fonts.load("100px 'Anton'"),
	document.fonts.load("800 100px 'Montserrat'"),
	document.fonts.load("600 100px 'Montserrat'"),
]).then(() => continueRender(fontsHandle));

export const RemotionRoot: React.FC = () => (
	<Composition
		id="BrunchEntreAmis"
		component={BrunchVideo}
		durationInFrames={DURATION_S * VIDEO.fps}
		fps={VIDEO.fps}
		width={VIDEO.width}
		height={VIDEO.height}
	/>
);
