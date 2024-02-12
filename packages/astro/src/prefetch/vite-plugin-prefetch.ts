import type * as vite from 'vite';
import type { AstroSettings } from '../@types/astro.js';

const virtualModuleId = 'astro:prefetch';
const resolvedVirtualModuleId = '\0' + virtualModuleId;
const prefetchInternalModuleFsSubpath = 'astro/dist/prefetch/index.js';
const prefetchCode = `import { init } from 'astro/virtual-modules/prefetch.js';init()`;

export default function astroPrefetch({ settings }: { settings: AstroSettings }): vite.Plugin {
	const prefetchOption = settings.config.prefetch;
	const prefetch = prefetchOption
		? typeof prefetchOption === 'object'
			? prefetchOption
			: {}
		: undefined;

	// Check against existing scripts as this plugin could be called multiple times
	if (prefetch && settings.scripts.every((s) => s.content !== prefetchCode)) {
		// Inject prefetch script to all pages
		settings.scripts.push({
			stage: 'page',
			content: `import { init } from 'astro/virtual-modules/prefetch.js';init()`,
		});
	}

	// Throw a normal error instead of an AstroError as Vite captures this in the plugin lifecycle
	// and would generate a different stack trace itself through esbuild.
	const throwPrefetchNotEnabledError = () => {
		throw new Error('You need to enable the `prefetch` Astro config to import `astro:prefetch`');
	};

	return {
		name: 'astro:prefetch',
		async resolveId(id) {
			if (id === virtualModuleId) {
				if (!prefetch) throwPrefetchNotEnabledError();
				return resolvedVirtualModuleId;
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				if (!prefetch) throwPrefetchNotEnabledError();
				return `export { prefetch } from "astro/virtual-modules/prefetch.js";`;
			}
		},
		transform(code, id) {
			// NOTE: Handle replacing the specifiers even if prefetch is disabled so View Transitions
			// can import the interal module as not hit runtime issues.
			if (id.includes(prefetchInternalModuleFsSubpath)) {
				return code
					.replace('__PREFETCH_PREFETCH_ALL__', JSON.stringify(prefetch?.prefetchAll))
					.replace('__PREFETCH_DEFAULT_STRATEGY__', JSON.stringify(prefetch?.defaultStrategy))
					.replace(
						'__EXPERIMENTAL_CLIENT_PRERENDER__',
						JSON.stringify(settings.config.experimental.clientPrerender)
					);
			}
		},
	};
}
