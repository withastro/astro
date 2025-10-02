import type { Plugin } from 'vite';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { fromRoutingStrategy } from '../i18n/utils.js';
import type {
	AstroConfig,
	ClientDeserializedManifest,
	ServerDeserializedManifest,
	SSRManifest,
} from '../types/public/index.js';

const VIRTUAL_SERVER_ID = 'astro:config/server';
const RESOLVED_VIRTUAL_SERVER_ID = '\0' + VIRTUAL_SERVER_ID;
const VIRTUAL_CLIENT_ID = 'astro:config/client';
const RESOLVED_VIRTUAL_CLIENT_ID = '\0' + VIRTUAL_CLIENT_ID;

export default function virtualModulePlugin({ manifest }: { manifest: SSRManifest }): Plugin {
	return {
		enforce: 'pre',
		name: 'astro-manifest-plugin',
		resolveId(id) {
			// Resolve the virtual module
			if (VIRTUAL_SERVER_ID === id) {
				return RESOLVED_VIRTUAL_SERVER_ID;
			} else if (VIRTUAL_CLIENT_ID === id) {
				return RESOLVED_VIRTUAL_CLIENT_ID;
			}
		},
		load(id, opts) {
			// client
			if (id === RESOLVED_VIRTUAL_CLIENT_ID) {
				// There's nothing wrong about using `/client` on the server
				return { code: serializeClientConfig(manifest) };
			}
			// server
			else if (id == RESOLVED_VIRTUAL_SERVER_ID) {
				if (!opts?.ssr) {
					throw new AstroError({
						...AstroErrorData.ServerOnlyModule,
						message: AstroErrorData.ServerOnlyModule.message(VIRTUAL_SERVER_ID),
					});
				}
				return { code: serializeServerConfig(manifest) };
			}
		},
	};
}

function serializeClientConfig(manifest: SSRManifest): string {
	let i18n: AstroConfig['i18n'] | undefined = undefined;
	if (manifest.i18n) {
		i18n = {
			defaultLocale: manifest.i18n.defaultLocale,
			locales: manifest.i18n.locales,
			routing: fromRoutingStrategy(manifest.i18n.strategy, manifest.i18n.fallbackType),
			fallback: manifest.i18n.fallback,
		};
	}
	const serClientConfig: ClientDeserializedManifest = {
		base: manifest.base,
		i18n,
		build: {
			format: manifest.buildFormat,
		},
		trailingSlash: manifest.trailingSlash,
		compressHTML: manifest.compressHTML,
		site: manifest.site,
	};

	const output = [];
	for (const [key, value] of Object.entries(serClientConfig)) {
		output.push(`export const ${key} = ${stringify(value)};`);
	}
	return output.join('\n') + '\n';
}

function serializeServerConfig(manifest: SSRManifest): string {
	let i18n: AstroConfig['i18n'] | undefined = undefined;
	if (manifest.i18n) {
		i18n = {
			defaultLocale: manifest.i18n.defaultLocale,
			routing: fromRoutingStrategy(manifest.i18n.strategy, manifest.i18n.fallbackType),
			locales: manifest.i18n.locales,
			fallback: manifest.i18n.fallback,
		};
	}
	const serverConfig: ServerDeserializedManifest = {
		build: {
			server: new URL(manifest.buildServerDir),
			client: new URL(manifest.buildClientDir),
			format: manifest.buildFormat,
		},
		cacheDir: new URL(manifest.cacheDir),
		outDir: new URL(manifest.outDir),
		publicDir: new URL(manifest.publicDir),
		srcDir: new URL(manifest.srcDir),
		root: new URL(manifest.hrefRoot),
		base: manifest.base,
		i18n,
		trailingSlash: manifest.trailingSlash,
		site: manifest.site,
		compressHTML: manifest.compressHTML,
	};
	const output = [];
	for (const [key, value] of Object.entries(serverConfig)) {
		output.push(`export const ${key} = ${stringify(value)};`);
	}
	return output.join('\n') + '\n';
}

function stringify(value: any): string {
	if (Array.isArray(value)) {
		return `[${value.map((e) => stringify(e)).join(', ')}]`;
	}
	if (value instanceof URL) {
		return `new URL(${JSON.stringify(value)})`;
	}
	if (typeof value === 'object') {
		return `{\n${Object.entries(value)
			.map(([k, v]) => `${JSON.stringify(k)}: ${stringify(v)}`)
			.join(',\n')}\n}`;
	}
	return JSON.stringify(value);
}
