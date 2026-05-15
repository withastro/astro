import type { Plugin as VitePlugin } from 'vite';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
/** Connect Astro integrations into Vite, as needed. */
export default function astroIntegrationsContainerPlugin({
	settings,
	logger,
}: {
	settings: AstroSettings;
	logger: AstroLogger;
}): VitePlugin;
