import type { Plugin } from 'vite';
import type { AstroLogger } from '../core/logger/core.js';
import { LIVE_COLLECTIONS_FLAG, LIVE_CONTENT_TYPE } from './consts.js';
import { sliceLiveCollections } from './live-collections.js';
import { globalContentConfigObserver } from './utils.js';

/**
 * Transforms the content config module imported by the `astro:content` runtime, so that it
 * only contains the live collections. See `sliceLiveCollections()`.
 */
export function astroLiveCollectionsPlugin({ logger }: { logger: AstroLogger }): Plugin {
	const warnings = new Set<string>();
	function warnOnce(message: string) {
		if (warnings.has(message)) return;
		warnings.add(message);
		logger.warn('content', message);
	}

	return {
		name: 'astro:content-live-collections',
		transform: {
			filter: { id: new RegExp(`(?:\\?|&)${LIVE_COLLECTIONS_FLAG}(?:&|=|$)`) },
			handler(code, id) {
				const file = id.split('?')[0];
				// The observer is only read, never awaited: the content config imports `astro:content`,
				// which imports this module, so waiting for the config to load could deadlock.
				const observed = globalContentConfigObserver.get();
				const liveNames =
					observed.status === 'loaded'
						? new Set(
								Object.entries(observed.config.collections)
									.filter(([, collection]) => collection.type === LIVE_CONTENT_TYPE)
									.map(([name]) => name),
							)
						: undefined;
				if (liveNames?.size === 0) {
					return { code: 'export const collections = {};', map: null };
				}

				const result = sliceLiveCollections(code, this.parse(code), liveNames);
				if (result.type === 'unsupported') {
					// Without the evaluated config, the live collections can't be checked.
					if (!liveNames) {
						return { code: 'export const collections = {};', map: null };
					}
					const location = result.location ? `:${result.location.line}:${result.location.column}` : '';
					warnOnce(
						`The live collections in ${file}${location} can't be separated from the build-time collections, because ${result.reason}. The whole content config is bundled into the server, including build-time loaders and their dependencies.`,
					);
					return;
				}
				if (liveNames && result.droppedStatements.length > 0) {
					const locations = result.droppedStatements
						.map(({ line, column }) => `${file}:${line}:${column}`)
						.join(', ');
					warnOnce(
						`These top-level statements of the content config don't run with the live collections at request time, because the live collections don't reference them: ${locations}`,
					);
				}
				return { code: result.code, map: result.map };
			},
		},
	};
}
