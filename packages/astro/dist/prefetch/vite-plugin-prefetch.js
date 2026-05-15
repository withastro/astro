const VIRTUAL_MODULE_ID = 'astro:prefetch';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;
const prefetchInternalModuleFsSubpath = 'astro/dist/prefetch/index.js';
const prefetchCode = `import { init } from 'astro/virtual-modules/prefetch.js';init()`;
function astroPrefetch({ settings }) {
	const prefetchOption = settings.config.prefetch;
	const prefetch = prefetchOption
		? typeof prefetchOption === 'object'
			? prefetchOption
			: {}
		: void 0;
	if (prefetch && settings.scripts.every((s) => s.content !== prefetchCode)) {
		settings.scripts.push({
			stage: 'page',
			content: `import { init } from 'astro/virtual-modules/prefetch.js';init()`,
		});
	}
	const throwPrefetchNotEnabledError = () => {
		throw new Error('You need to enable the `prefetch` Astro config to import `astro:prefetch`');
	};
	return {
		name: 'astro:prefetch',
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_MODULE_ID}$`),
			},
			handler() {
				if (!prefetch) throwPrefetchNotEnabledError();
				return RESOLVED_VIRTUAL_MODULE_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_MODULE_ID}$`),
			},
			handler() {
				if (!prefetch) throwPrefetchNotEnabledError();
				return { code: `export { prefetch } from "astro/virtual-modules/prefetch.js";` };
			},
		},
		transform: {
			filter: {
				// NOTE: Handle replacing the specifiers even if prefetch is disabled so View Transitions
				// can import the internal module and not hit runtime issues.
				id: new RegExp(`${prefetchInternalModuleFsSubpath}`),
			},
			handler(code) {
				code = code
					.replace(
						'__PREFETCH_PREFETCH_ALL__',
						// length: 25
						`${JSON.stringify(prefetch?.prefetchAll)}`.padEnd(25),
					)
					.replace(
						'__PREFETCH_DEFAULT_STRATEGY__',
						// length: 29
						`${JSON.stringify(prefetch?.defaultStrategy)}`.padEnd(29),
					)
					.replace(
						'__EXPERIMENTAL_CLIENT_PRERENDER__',
						// length: 33
						`${JSON.stringify(settings.config.experimental.clientPrerender)}`.padEnd(33),
					);
				return { code, map: null };
			},
		},
	};
}
export { astroPrefetch as default };
