import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import {
	bundledLanguages as shikiBundledLanguages,
	bundledThemes as shikiBundledThemes,
} from 'shiki';
import type { AstroSettings } from '../types/astro.js';

const MODULE_ID = 'virtual:astro:shiki-optimize';
const RESOLVED_PREFIX = '\0' + MODULE_ID;

export default function shikiOptimizePlugin({ settings }: { settings: AstroSettings }): Plugin {
	return {
		name: 'astro:shiki-optimize',
		configEnvironment(environmentName) {
			if (environmentName === 'ssr') {
				return {
					// We exclude 'shiki' from pre-bundling because the virtual module
					// contains numerous dynamic imports for languages and themes.
					// This prevents Vite from flooding the console with "new dependencies optimized"
					// logs, especially when using the Cloudflare Workers integration.
					optimizeDeps: {
						exclude: ['shiki'],
					},
				};
			}
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${MODULE_ID}$`),
			},
			handler() {
				return RESOLVED_PREFIX;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_PREFIX}$`),
			},
			async handler() {
				let langs: string[];
				let themes: string[];
				const isSSR = this.environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr;

				if (isSSR && Object.keys(settings.config.experimental.optimizeShiki).length !== 0) {
					langs =
						settings.config.experimental.optimizeShiki?.includeLangs ??
						Object.keys(shikiBundledLanguages);
					themes =
						settings.config.experimental.optimizeShiki?.includeThemes ??
						Object.keys(shikiBundledThemes);
				} else {
					langs = Object.keys(shikiBundledLanguages);
					themes = Object.keys(shikiBundledThemes);
				}

				const importerPath = fileURLToPath(import.meta.url);

				const resolveModules = async (type: 'langs' | 'themes', name: string) => {
					const resolvedId = await this.resolve(`shiki/${type}/${name}.mjs`, importerPath);

					return { resolvedId: resolvedId?.id, name };
				};
				const createObjectEntry = (
					resolvedIds: { resolvedId: string | undefined; name: string }[],
				) => {
					return resolvedIds
						.filter(({ resolvedId }) => resolvedId !== undefined)
						.map(
							({ resolvedId, name }) =>
								`${JSON.stringify(name)}: () => import(${JSON.stringify(resolvedId)})`,
						);
				};

				const langResolvedIdsPromise = Promise.all(
					langs.map(async (lang) => {
						// Shiki does not contain files with names containing #, such as `c#.mjs`
						const langName = lang.replace('#', 'sharp');

						return resolveModules('langs', langName);
					}),
				);
				const themeResolvedIdsPromise = Promise.all(
					themes.map(async (theme) => resolveModules('themes', theme)),
				);
				const [langResolvedIds, themeResolvedIds] = await Promise.all([
					langResolvedIdsPromise,
					themeResolvedIdsPromise,
				]);
				const bundledLanguages = createObjectEntry(langResolvedIds);
				const bundledThemes = createObjectEntry(themeResolvedIds);

				return `
					export const bundledLanguages = { ${bundledLanguages.join(',')} };
					export const bundledThemes = { ${bundledThemes.join(',')} };
				`;
			},
		},
	};
}
