/**
 * **IMPORTANT**: use the `Pick` interface to select only the properties that we want to expose
 * to the users. Using blanket types could expose properties that we don't want. So if we decide to expose
 * properties, we need to be good at justifying them. For example: why you need this config? can't you use an integration?
 * why do you need access to the shiki config? (very low-level config)
 */
import type { SSRManifest } from '../../core/app/types.js';
import type { AstroConfig } from './config.js';
type Extend<T, U> = {
	[K in keyof T]: T[K] | U;
};
type Dirs = Pick<SSRManifest, 'cacheDir' | 'outDir' | 'publicDir' | 'srcDir'>;
type DeserializedDirs = Extend<Dirs, URL>;
export type ServerDeserializedManifest = Pick<
	SSRManifest,
	'base' | 'trailingSlash' | 'compressHTML' | 'site'
> &
	DeserializedDirs & {
		i18n: AstroConfig['i18n'];
		build: Pick<AstroConfig['build'], 'server' | 'client' | 'format' | 'assetsPrefix'>;
		root: URL;
		image: Pick<AstroConfig['image'], 'objectFit' | 'objectPosition' | 'layout'>;
	};
export type ClientDeserializedManifest = Pick<
	SSRManifest,
	'base' | 'trailingSlash' | 'compressHTML' | 'site'
> & {
	i18n: AstroConfig['i18n'];
	build: Pick<AstroConfig['build'], 'format'>;
	image: Pick<AstroConfig['image'], 'objectFit' | 'objectPosition' | 'layout'>;
};
export {};
