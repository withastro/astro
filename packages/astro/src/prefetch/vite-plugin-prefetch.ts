import * as vite from 'vite';
import type { AstroSettings } from '../@types/astro.js';

const virtualModuleId = 'astro:internal-prefetch';
const resolvedVirtualModuleId = '\0' + virtualModuleId;
const prefetchInternalModuleFsSubpath = 'astro/dist/prefetch/index.js';

export default function astroPrefetch({ settings }: { settings: AstroSettings }): vite.Plugin {
	const prefetchOption = settings.config.prefetch;
	const prefetch = prefetchOption
		? typeof prefetchOption === 'object'
			? prefetchOption
			: {}
		: undefined;

	if (prefetch) {
		// Inject prefetch script to all pages
		settings.scripts.push({
			stage: 'page',
			content: `import { init } from 'astro/prefetch';init()`,
		});
	}

	return {
		name: 'astro:prefetch',
		async resolveId(id) {
			if (prefetch && id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		load(id) {
			if (prefetch && id === resolvedVirtualModuleId) {
				return `export { prefetch } from "astro/prefetch";`;
			}
		},
		transform(code, id) {
			// NOTE: Handle replacing the specifiers even if prefetch is disabled so View Transitions
			// can import the interal module as not hit runtime issues.
			if (id.includes(prefetchInternalModuleFsSubpath)) {
				return code
					.replace('__PREFETCH_PREFETCH_ALL__', JSON.stringify(prefetch?.prefetchAll))
					.replace('__PREFETCH_DEFAULT_STRATEGY__', JSON.stringify(prefetch?.defaultStrategy));
			}
		},
	};
}
