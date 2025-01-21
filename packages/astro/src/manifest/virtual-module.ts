import type { Plugin } from 'vite';
import { CantUseManifestModule } from '../core/errors/errors-data.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { Logger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import type {
	AstroConfig,
	ClientConfigSerialized,
	ServerConfigSerialized,
} from '../types/public/index.js';

const VIRTUAL_SERVER_ID = 'astro:manifest/server';
const RESOLVED_VIRTUAL_SERVER_ID = '\0' + VIRTUAL_SERVER_ID;
const VIRTUAL_CLIENT_ID = 'astro:manifest/client';
const RESOLVED_VIRTUAL_CLIENT_ID = '\0' + VIRTUAL_CLIENT_ID;

export default function virtualModulePlugin({
	settings,
	logger: _logger,
}: { settings: AstroSettings; logger: Logger }): Plugin {
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
				if (!settings.config.experimental.serializeManifest) {
					throw new AstroError({
						...CantUseManifestModule,
						message: CantUseManifestModule.message(VIRTUAL_CLIENT_ID),
					});
				}
				// There's nothing wrong about using `/client` on the server
				return `${serializeClientConfig(settings.config)};`;
			}
			// server
			else if (id == RESOLVED_VIRTUAL_SERVER_ID) {
				if (!settings.config.experimental.serializeManifest) {
					throw new AstroError({
						...CantUseManifestModule,
						message: CantUseManifestModule.message(VIRTUAL_SERVER_ID),
					});
				}
				if (!opts?.ssr) {
					throw new AstroError({
						...AstroErrorData.ServerOnlyModule,
						message: AstroErrorData.ServerOnlyModule.message(VIRTUAL_SERVER_ID),
					});
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
		build: {
			client: config.build.client,
			server: config.build.server,
		},
		cacheDir: config.cacheDir,
		outDir: config.outDir,
		publicDir: config.publicDir,
		srcDir: config.srcDir,
		root: config.root,
	};
	const output = [];
	for (const [key, value] of Object.entries(serverConfig)) {
		output.push(`export const ${key} = ${JSON.stringify(value)};`);
	}
	return output.join('\n') + '\n';
}
