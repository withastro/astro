import type * as vite from 'vite';
import { PROPAGATED_ASSET_FLAG } from '../content/consts.js';

const VIRTUAL_MODULE_ID = 'astro:dynamic';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;
const ASSETS_QUERY = 'assets';

/**
 * Exposes `astro:dynamic` and, when the feature is enabled, rewrites the
 * `?assets` query on dynamically imported Astro components to the
 * propagated-assets boundary, so a component loaded through `dynamic()`
 * reports its own styles and links.
 */
export default function astroDynamic({ enabled }: { enabled: boolean }): vite.Plugin {
	return {
		name: 'astro:dynamic',
		enforce: 'pre',
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_MODULE_ID}$|(?:\\?|&)${ASSETS_QUERY}(?:&|=|$)`),
			},
			async handler(id, importer, opts) {
				if (id === VIRTUAL_MODULE_ID) {
					return RESOLVED_VIRTUAL_MODULE_ID;
				}
				if (!enabled) return;
				const [base] = id.split('?');
				if (!base.endsWith('.astro')) return;
				const resolved = await this.resolve(base, importer, { skipSelf: true, ...opts });
				if (!resolved) return;
				resolved.id = `${resolved.id}?${PROPAGATED_ASSET_FLAG}`;
				return resolved;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_MODULE_ID}$`),
			},
			handler() {
				if (!enabled) {
					return `export function dynamic() {
	throw new Error('The \`astro:dynamic\` module requires enabling \`experimental.dynamicComponents\` in the Astro config.');
}`;
				}
				return `export { dynamic } from 'astro/virtual-modules/dynamic.js';`;
			},
		},
	};
}
