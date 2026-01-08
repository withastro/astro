/**
 * **IMPORTANT**: use the `Pick` interface to select only the properties that we want to expose
 * to the users. Using blanket types could expose properties that we don't want. So if we decide to expose
 * properties, we need to be good at justifying them. For example: why you need this config? can't you use an integration?
 * why do you need access to the shiki config? (very low-level confiig)
 */

import type { SSRManifest } from '../../core/app/types.js';
import type { AstroConfig } from './config.js';

// do not export
type Extend<T, U> = { [K in keyof T]: T[K] | U };

// do not export
type Dirs = Pick<SSRManifest, 'cacheDir' | 'outDir' | 'publicDir' | 'srcDir'>;

// do not export
type DeserializedDirs = Extend<Dirs, URL>;

type ConditionalType<TValue, TCondition> = TCondition extends 'enabled'
	? TValue
	: TValue | undefined;

interface I18n extends NonNullable<AstroConfig['i18n']> {
	defaultLocale: AstroFeatures.I18nDefaultLocale;
	locales: AstroFeatures.I18nLocales;
}

// Export types after this comment

export interface ServerDeserializedManifest
	extends Pick<SSRManifest, 'base' | 'trailingSlash' | 'compressHTML'>,
		DeserializedDirs {
	i18n: ConditionalType<I18n, AstroFeatures.I18n>;
	build: Pick<AstroConfig['build'], 'server' | 'client' | 'format'>;
	root: URL;
	site: ConditionalType<URL, AstroFeatures.Site>;
}

export interface ClientDeserializedManifest
	extends Pick<SSRManifest, 'base' | 'trailingSlash' | 'compressHTML'> {
	i18n: ConditionalType<I18n, AstroFeatures.I18n>;
	build: Pick<AstroConfig['build'], 'format'>;
	site: ConditionalType<URL, AstroFeatures.Site>;
}
