import {
	getClientOutputDirectory as getLayoutClientOutputDirectory,
	getPrerenderOutputDirectory as getLayoutPrerenderOutputDirectory,
	getServerOutputDirectory as getLayoutServerOutputDirectory,
	type OutputLayout,
} from '@astrojs/vite-plugin-router/_internal/core/build/common.js';
import type { AstroSettings } from '../types/astro.js';
import type { AstroConfig } from '../types/public/config.js';

export function getPrerenderDefault(config: AstroConfig) {
	return config.output !== 'server';
}

function toOutputLayout(settings: AstroSettings): OutputLayout {
	return { config: settings.config, buildOutput: settings.buildOutput!, host: settings };
}

/**
 * Returns the correct output directory of the SSR build based on the configuration
 */
export function getServerOutputDirectory(settings: AstroSettings): URL {
	return getLayoutServerOutputDirectory(toOutputLayout(settings));
}

/**
 * Returns the output directory used by the prerender environment.
 */
export function getPrerenderOutputDirectory(settings: AstroSettings): URL {
	return getLayoutPrerenderOutputDirectory(toOutputLayout(settings));
}

/**
 * Returns the correct output directory of the client build based on the configuration
 */
export function getClientOutputDirectory(settings: AstroSettings): URL {
	return getLayoutClientOutputDirectory(toOutputLayout(settings));
}
