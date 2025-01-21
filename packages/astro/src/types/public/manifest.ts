/**
 * **IMPORTANT**: use the `Pick` interface to select only the properties that we want to expose
 * to the users. Using blanket types could expose properties that we don't want. So if we decide to expose
 * properties, we need to be good at justifying them. For example: why you need this config? can't you use an integration?
 * why do you need access to the shiki config? (very low-level confiig)
 */

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
