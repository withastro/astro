import type { Plugin } from 'vite';
import { CantUseManifestModule, ForbiddenManifestModule } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/index.js';
import type { Logger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import type {
	AstroConfig,
	ClientConfigSerialized,
	ServerConfigSerialized,
} from '../types/public/index.js';

const VIRTUAL_MODULES_IDS = {
	client: 'astro:manifest/client',
	server: 'astro:manifest/server',
};

const VIRTUAL_MODULES_IDS_SET = new Set(Object.values(VIRTUAL_MODULES_IDS));

function resolveVirtualModuleId<T extends string>(id: T): `\0${T}` {
	return `\0${id}`;
}

export default function virtualModulePlugin({
	settings,
	logger,
}: { settings: AstroSettings; logger: Logger }): Plugin {
	return {
		enforce: 'pre',
		name: 'astro-manifest-plugin',
		resolveId(id) {
			// Resolve the virtual module
			if (VIRTUAL_MODULES_IDS_SET.has(id)) {
				return resolveVirtualModuleId(id);
			}
		},
		load(id, opts) {
			// client
			if (id === resolveVirtualModuleId(VIRTUAL_MODULES_IDS.client)) {
				if (!settings.config.experimental.serializeManifest) {
					throw new AstroError({
						...CantUseManifestModule,
						message: CantUseManifestModule.message(VIRTUAL_MODULES_IDS.client),
					});
				}
				// There's nothing wrong about using `/client` on the server
				return `${serializeClientConfig(settings.config)};`;
			}
			// server
			else if (id == resolveVirtualModuleId(VIRTUAL_MODULES_IDS.server)) {
				if (!settings.config.experimental.serializeManifest) {
					throw new AstroError({
						...CantUseManifestModule,
						message: CantUseManifestModule.message(VIRTUAL_MODULES_IDS.server),
					});
				}
				if (!opts?.ssr) {
					throw new AstroError(ForbiddenManifestModule);
				}
				return `${serializeServerConfig(settings.config)};`;
			}
		},
	};
}

function serializeClientConfig(config: AstroConfig): string {
	const serClientConfig: ClientConfigSerialized = {
		base: config.base,
		i18n: config.i18n,
		build: {
			format: config.build.format,
			redirects: config.build.redirects,
		},
		trailingSlash: config.trailingSlash,
		compressHTML: config.compressHTML,
		site: config.site,
		legacy: config.legacy,
	};

	const output = [];
	for (const [key, value] of Object.entries(serClientConfig)) {
		output.push(`export const ${key} = ${JSON.stringify(value)};`);
	}
	return output.join('\n') + '\n';
}

function serializeServerConfig(config: AstroConfig): string {
	const serverConfig: ServerConfigSerialized = {
		base: config.base,
		i18n: config.i18n,
		build: {
			client: config.build.client,
			server: config.build.server,
			format: config.build.format,
			redirects: config.build.redirects,
		},
		trailingSlash: config.trailingSlash,
		compressHTML: config.compressHTML,
		site: config.site,
		cacheDir: config.cacheDir,
		outDir: config.outDir,
		publicDir: config.publicDir,
		srcDir: config.srcDir,
		root: config.root,
		legacy: config.legacy,
	};
	const output = [];
	for (const [key, value] of Object.entries(serverConfig)) {
		output.push(`export const ${key} = ${JSON.stringify(value)};`);
	}
	return output.join('\n') + '\n';
}
