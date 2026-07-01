import type { PluginOption } from 'vite';

const VIRTUAL_CONFIG_ID = 'virtual:astro-cloudflare:config';
const RESOLVED_VIRTUAL_CONFIG_ID = '\0' + VIRTUAL_CONFIG_ID;

export interface CompileImageConfig {
	base: string;
	assetsPrefix: string | undefined;
	imageServiceEntrypoint: string;
	buildAssets: string;
}

export interface Config {
	sessionKVBindingName: string;
	compileImageConfig: CompileImageConfig | null;
	isPrerender: boolean;
	/**
	 * True when the user has configured the Cloudflare cache provider.
	 * Used by the request handler to default uncached responses to
	 * `Cloudflare-CDN-Cache-Control: no-store`, so that opting in to the
	 * cache provider never accidentally caches routes that don't use it.
	 */
	cacheProviderEnabled: boolean;
}

export function createConfigPlugin(config: Omit<Config, 'isPrerender'>): PluginOption {
	return {
		name: VIRTUAL_CONFIG_ID,
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_CONFIG_ID}$`),
			},
			handler() {
				return RESOLVED_VIRTUAL_CONFIG_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_CONFIG_ID}$`),
			},
			handler() {
				return [
					...Object.entries(config).map(([k, v]) => `export const ${k} = ${JSON.stringify(v)};`),
					`export const isPrerender = ${this.environment?.name === 'prerender'};`,
				].join('\n');
			},
		},
	};
}
