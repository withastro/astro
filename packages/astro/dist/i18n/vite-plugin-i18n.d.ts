import type * as vite from 'vite';
import type { AstroSettings } from '../types/astro.js';
type AstroInternationalization = {
	settings: AstroSettings;
};
export default function astroInternationalization({
	settings,
}: AstroInternationalization): vite.Plugin;
export {};
