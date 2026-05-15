import { type Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';
export default function astroScriptsPostPlugin({
	settings,
}: {
	settings: AstroSettings;
}): VitePlugin;
