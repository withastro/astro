import type { AstroConfig } from './config.js';

export type SerializedClientBuild = Pick<AstroConfig['build'], 'format' | 'redirects'>;

export type SerializedServerBuild = Pick<AstroConfig['build'], 'client' | 'server'>;

export type ClientConfigSerialized = Pick<
	AstroConfig,
	'base' | 'i18n' | 'trailingSlash' | 'compressHTML' | 'site' | 'legacy'
> & {
	build: SerializedClientBuild;
};

export type ServerConfigSerialized = Pick<
	AstroConfig,
	'cacheDir' | 'outDir' | 'publicDir' | 'srcDir' | 'root'
> & {
	build: SerializedServerBuild;
};
