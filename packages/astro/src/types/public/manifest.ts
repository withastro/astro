import type { AstroConfig } from './config.js';

export type SerializedClientBuild = Pick<AstroConfig['build'], 'format' | 'redirects'>;

export type SerializedServerBuild = Pick<
	AstroConfig['build'],
	'format' | 'client' | 'server' | 'redirects'
>;

export type ClientConfigSerialized = Pick<
	AstroConfig,
	'base' | 'i18n' | 'trailingSlash' | 'compressHTML' | 'site' | 'legacy'
> & {
	build: SerializedClientBuild;
};

export type ServerConfigSerialized = ClientConfigSerialized &
	Pick<AstroConfig, 'cacheDir' | 'outDir' | 'publicDir' | 'srcDir' | 'root'> & {
		build: SerializedServerBuild;
	};
