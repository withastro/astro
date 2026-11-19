import type { ActionClient } from '../../actions/runtime/types.js';
import type { SerializedStaticImage } from '../../assets/types.js';
import type { Locales } from '../../types/public/config.js';
import type { CacheProviderFactory, SSRManifestCache } from '../cache/types.js';
import type { BaseSessionConfig, SessionDriverFactory } from '../session/types.js';
import type { RoutingStrategies } from './common.js';

export * from '@astrojs/vite-plugin-router/_internal/core/app/types.js';

declare module '@astrojs/vite-plugin-router' {
	interface SSRManifestExtensions {
		actions: SSRActions;
		sessionDriver: { default: SessionDriverFactory | null };
		cacheProvider: { default: CacheProviderFactory | null };
	}
	interface SSRManifestData {
		i18n: SSRManifestI18n | undefined;
		actionBodySizeLimit: number;
		sessionConfig: SSRManifestSession | undefined;
		cacheConfig: SSRManifestCache | undefined;
		image: {
			objectFit?: string;
			objectPosition?: string;
			layout?: string;
		};
	}
	interface PrerenderPathMetadata {
		staticImages: SerializedStaticImage[];
		referencedImages: string[];
	}
}

export type SSRActions = {
	server: Record<string, ActionClient<any, any, any>>;
};

export type SSRManifestI18n = {
	fallback: Record<string, string> | undefined;
	fallbackType: 'redirect' | 'rewrite';
	strategy: RoutingStrategies;
	locales: Locales;
	defaultLocale: string;
	domainLookupTable: Record<string, string>;
	domains: Record<string, string> | undefined;
};

export interface SSRManifestSession extends BaseSessionConfig {
	driver: string;
	options?: Record<string, any> | undefined;
}
