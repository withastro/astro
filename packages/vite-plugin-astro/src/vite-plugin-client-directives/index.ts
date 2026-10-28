import type { Plugin } from 'vite';
import { buildClientDirectiveEntrypoint } from '../core/client-directive/build.js';
import type { ClientDirectiveConfig } from '@astrojs/runtime/types';

export const CLIENT_DIRECTIVES_MODULE_ID = 'virtual:astro:client-directives';
const RESOLVED_CLIENT_DIRECTIVES_MODULE_ID = `\0${CLIENT_DIRECTIVES_MODULE_ID}`;

export interface ClientDirectivesPluginOptions {
	clientDirectives: readonly ClientDirectiveConfig[];
	/** Returns the project root that custom directive entrypoints are bundled from. */
	getRoot: () => URL;
}

/**
 * Serves `virtual:astro:client-directives`, which exports `clientDirectives`: a map of directive
 * name to the inline script that defines it. Custom directives are bundled once, on first load.
 */
export default function vitePluginClientDirectives({
	clientDirectives,
	getRoot,
}: ClientDirectivesPluginOptions): Plugin {
	let customDirectives: Promise<[string, string][]> | undefined;

	return {
		name: 'astro:client-directives',
		resolveId: {
			filter: { id: new RegExp(`^${CLIENT_DIRECTIVES_MODULE_ID}$`) },
			handler() {
				return RESOLVED_CLIENT_DIRECTIVES_MODULE_ID;
			},
		},
		load: {
			filter: { id: new RegExp(`^${RESOLVED_CLIENT_DIRECTIVES_MODULE_ID}$`) },
			async handler() {
				customDirectives ??= Promise.all(
					clientDirectives.map(
						async ({ name, entrypoint }): Promise<[string, string]> => [
							name,
							await buildClientDirectiveEntrypoint(name, entrypoint, getRoot()),
						],
					),
				);
				const custom = await customDirectives;
				return {
					code: `import { getDefaultClientDirectives } from '@astrojs/runtime/internal/core/client-directive/default.js';
const clientDirectives = getDefaultClientDirectives();
for (const [name, code] of ${JSON.stringify(custom)}) clientDirectives.set(name, code);
export { clientDirectives };`,
				};
			},
		},
	};
}
