import type { Plugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';
import { createSerializedManifest } from '../vite-plugin-astro-server/plugin.js';

export const SERIALIZED_MANIFEST_ID = 'astro:serialized-manifest';
const SERIALIZED_MANIFEST_RESOLVED_ID = '\0' + SERIALIZED_MANIFEST_ID;

export async function serializedManifestPlugin({
	settings,
}: {
	settings: AstroSettings;
}): Promise<Plugin> {
	const serialized = await createSerializedManifest(settings);

	return {
		name: 'astro:serialized-manifest',
		enforce: 'pre',
		resolveId(id) {
			if (id === SERIALIZED_MANIFEST_ID) {
				return SERIALIZED_MANIFEST_RESOLVED_ID;
			}
		},

		async load(id) {
			if (id === SERIALIZED_MANIFEST_RESOLVED_ID) {
				const code = `
					import { deserializeManifest as _deserializeManifest } from 'astro/app';
					export const manifest = _deserializeManifest((${JSON.stringify(serialized)}));
				`;
				return { code };
			}
		},
	};
}
