import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Plugin } from 'vite';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { appendForwardSlash } from '../core/path.js';
import { normalizePath } from '../core/viteUtils.js';
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

type StringifyOptions = {
	isBuild: boolean;
	urlPlaceholders: Map<string, string>;
};

export default function virtualModulePlugin({ manifest }: { manifest: SSRManifest }): Plugin {
	const stringifyOptions: StringifyOptions = {
		isBuild: false,
		urlPlaceholders: new Map<string, string>(),
	};
	let outDir: string | undefined;
	return {
		enforce: 'pre',
		name: 'astro-manifest-plugin',
		configResolved(config) {
			stringifyOptions.isBuild = config.command === 'build';
			outDir = config.build.outDir;
		},
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
				return { code: serializeClientConfig(manifest, stringifyOptions) };
			}
			// server
			else if (id == RESOLVED_VIRTUAL_SERVER_ID) {
				if (!opts?.ssr) {
					throw new AstroError({
						...AstroErrorData.ServerOnlyModule,
						message: AstroErrorData.ServerOnlyModule.message(VIRTUAL_SERVER_ID),
					});
				}
				return { code: serializeServerConfig(manifest, stringifyOptions) };
			}
		},
		generateBundle(_options, bundle) {
			if (!stringifyOptions.isBuild || stringifyOptions.urlPlaceholders.size === 0 || !outDir)
				return;

			const outDirUrl = pathToFileURL(path.resolve(outDir) + path.sep);
			for (const chunk of Object.values(bundle)) {
				if (chunk.type !== 'chunk') continue;
				let nextCode = chunk.code;
				const chunkUrl = new URL(chunk.fileName, outDirUrl);
				for (const [placeholder, target] of stringifyOptions.urlPlaceholders) {
					const relative = makeRelativeFileUrl(target, chunkUrl);
					nextCode = nextCode.replaceAll(
						JSON.stringify(placeholder),
						`new URL(${JSON.stringify(relative)}, import.meta.url)`,
					);
				}
				chunk.code = nextCode;
			}
		},
	};
}

function serializeClientConfig(manifest: SSRManifest, options: StringifyOptions): string {
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
		output.push(`export const ${key} = ${stringify(value, options)};`);
	}
	return output.join('\n') + '\n';
}

function serializeServerConfig(manifest: SSRManifest, options: StringifyOptions): string {
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
		output.push(`export const ${key} = ${stringify(value, options)};`);
	}
	return output.join('\n') + '\n';
}

function stringify(value: any, options: StringifyOptions): string {
	if (Array.isArray(value)) {
		return `[${value.map((e) => stringify(e, options)).join(', ')}]`;
	}
	if (value instanceof URL) {
		if (value.protocol === 'file:' && options.isBuild) {
			const placeholder = createUrlPlaceholder(options.urlPlaceholders, value.href);
			return JSON.stringify(placeholder);
		}
		return `new URL(${JSON.stringify(value)})`;
	}
	if (typeof value === 'object') {
		return `{\n${Object.entries(value)
			.map(([k, v]) => `${JSON.stringify(k)}: ${stringify(v, options)}`)
			.join(',\n')}\n}`;
	}
	return JSON.stringify(value);
}

function createUrlPlaceholder(store: Map<string, string>, value: string) {
	const key = `@@ASTRO_CONFIG_FILE_URL_${store.size}@@`;
	store.set(key, value);
	return key;
}

function makeRelativeFileUrl(value: string, chunkUrl: URL): string {
	if (!value.startsWith('file:')) return value;
	const baseDir = fileURLToPath(new URL('./', chunkUrl));
	const targetPath = fileURLToPath(new URL(value));
	let relative = path.relative(baseDir, targetPath);

	if (relative === '') {
		relative = '.';
	}

	if (path.isAbsolute(relative)) {
		return value;
	}

	relative = normalizePath(relative);
	if (value.endsWith('/')) {
		relative = appendForwardSlash(relative === '' ? '.' : relative);
	}
	return relative;
}
