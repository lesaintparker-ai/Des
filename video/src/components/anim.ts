import {Easing, interpolate, spring} from 'remotion';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Ressort d'entrée (0 → 1) démarrant à `delay` images.
export const pop = (frame: number, fps: number, delay = 0, damping = 12) =>
	spring({frame: frame - delay, fps, config: {damping, stiffness: 140, mass: 0.8}});

// Opacité d'entrée / sortie d'une scène de `duration` images.
export const fadeInOut = (frame: number, duration: number, fadeIn = 6, fadeOut = 6) =>
	interpolate(frame, [0, fadeIn, duration - fadeOut, duration], [0, 1, 1, 0], clamp);

export const ease = (frame: number, from: number, to: number, a = 0, b = 1) =>
	interpolate(frame, [from, to], [a, b], {...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1)});

export const sec = (s: number, fps: number) => Math.round(s * fps);
