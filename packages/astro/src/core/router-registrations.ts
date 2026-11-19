import { getRouterApi } from '@astrojs/vite-plugin-router';
import { PAGE_SCRIPT_ID } from '../vite-plugin-scripts/index.js';
import type { Plugin } from 'vite';
import { ACTIONS_ENTRYPOINT_VIRTUAL_MODULE_ID } from '../actions/consts.js';
import { generateStaticImages, StaticImageRegistry } from '../assets/build/generate.js';
import { normalizeTheLocale } from '../i18n/path.js';
import type { AstroSettings } from '../types/astro.js';
import type { AstroPrerenderer } from '../types/public/integrations.js';
import { toFallbackType } from './app/common.js';
import { toRoutingStrategy } from './app/entrypoints/index.js';
import type { SSRManifestI18n } from './app/types.js';
import type { AstroLogger } from '@astrojs/vite-plugin-router/_internal/core/logger/core.js';
import { cacheConfigToManifest } from './cache/utils.js';
import { VIRTUAL_CACHE_PROVIDER_ID } from './cache/vite-plugin.js';
import { sessionConfigToManifest } from './session/utils.js';
import { VIRTUAL_SESSION_DRIVER_ID } from './session/vite-plugin.js';

const DEFAULT_BODY_SIZE_LIMIT = 1024 * 1024;

function runtimeModule(path: string): URL {
	return new URL(path, import.meta.url);
}

/**
 * Registers Astro's features (sessions, cache, i18n, actions, image generation, prefetch),
 * integration middleware and integration page scripts with `api.astroRouter`, the same way a
 * standalone feature plugin would.
 *
 * Fetch handlers run in registration order, outermost first: sessions, cache, i18n, then user
 * middleware, then actions.
 */
export function vitePluginRouterRegistrations({
	settings,
	logger,
}: {
	settings: AstroSettings;
	logger: AstroLogger;
}): Plugin {
	return {
		name: 'astro:router-registrations',
		configResolved(viteConfig) {
			const api = getRouterApi(viteConfig);
			const { config } = settings;

			for (const entrypoint of settings.middlewares.pre) api.addMiddleware(entrypoint, 'pre');
			for (const entrypoint of settings.middlewares.post) api.addMiddleware(entrypoint, 'post');

			const isBuild = viteConfig.command === 'build';

			api.setManifestData('sessionConfig', sessionConfigToManifest(config.session));
			api.extendRenderContext('session', runtimeModule('./session/render-context.js'));
			api.extendManifest('sessionDriver', VIRTUAL_SESSION_DRIVER_ID);
			if (config.session !== false && config.session?.driver) {
				api.addFetchHandler('sessions', {
					entrypoint: runtimeModule('./session/fetch-handler.js'),
					order: 'pre',
				});
			}

			api.setManifestData('cacheConfig', cacheConfigToManifest(config.cache, config.routeRules));
			api.extendRenderContext('cache', runtimeModule('./cache/render-context.js'));
			if (config.cache?.provider) {
				api.extendManifest('cacheProvider', VIRTUAL_CACHE_PROVIDER_ID);
				api.addFetchHandler('cache', {
					entrypoint: runtimeModule('./cache/fetch-handler.js'),
					order: 'pre',
				});
			}

			api.setManifestData('i18n', createI18nManifest(settings, isBuild));
			if (config.i18n) {
				api.extendRouting(runtimeModule('./i18n/routing-extension.js'));
				api.extendRenderContext('currentLocale', runtimeModule('./i18n/context/current-locale.js'));
				api.extendRenderContext(
					'preferredLocale',
					runtimeModule('./i18n/context/preferred-locale.js'),
				);
				api.extendRenderContext(
					'preferredLocaleList',
					runtimeModule('./i18n/context/preferred-locale-list.js'),
				);
			}
			if (config.i18n && config.i18n.routing !== 'manual') {
				api.addFetchHandler('i18n', {
					entrypoint: runtimeModule('./i18n/fetch-handler.js'),
					order: 'pre',
				});
			}

			// The build only applies the configured limit to server output.
			api.setManifestData('actionBodySizeLimit', () =>
				config.security?.actionBodySizeLimit && (!isBuild || settings.buildOutput === 'server')
					? config.security.actionBodySizeLimit
					: DEFAULT_BODY_SIZE_LIMIT,
			);
			api.extendRenderContext(
				'getActionResult',
				runtimeModule('../actions/context/get-action-result.js'),
			);
			api.extendRenderContext('callAction', runtimeModule('../actions/context/call-action.js'));
			api.extendManifest('actions', ACTIONS_ENTRYPOINT_VIRTUAL_MODULE_ID);
			api.addFetchHandler('actions', {
				entrypoint: runtimeModule('../actions/fetch-handler.js'),
				order: 'post',
			});

			// Images of the paths the incremental build cache restored, generated with the rendered ones.
			const restoredImages = new StaticImageRegistry();
			// The build renders with `settings.prerenderer` or the default prerenderer, both
			// `AstroPrerenderer`s.
			api.onPrerenderDone((context) =>
				generateStaticImages(
					{ settings, logger },
					{ ...context, prerenderer: context.prerenderer as AstroPrerenderer | undefined },
					restoredImages,
				),
			);
			api.onPrerenderPathRestored(({ metadata }) => restoredImages.addMetadata(metadata));
			api.setManifestData('image', {
				objectFit: config.image.objectFit,
				objectPosition: config.image.objectPosition,
				layout: config.image.layout,
			});

			// `astro:scripts/page.js` bundles every `injectScript('page')` script.
			if (settings.scripts.some((script) => script.stage === 'page')) {
				api.addPageScript(PAGE_SCRIPT_ID);
			}

			if (config.prefetch !== false) {
				api.addClientRouterInit(runtimeModule('../prefetch/client-router-init.js'));
			}
		},
	};
}

function createI18nManifest(
	settings: AstroSettings,
	isBuild: boolean,
): SSRManifestI18n | undefined {
	const { i18n } = settings.config;
	if (!i18n) return undefined;
	// Domains are matched against the request host, which a dev server does not vary.
	const domainLookupTable: Record<string, string> = {};
	if (isBuild && i18n.domains) {
		for (const [locale, domainValue] of Object.entries(i18n.domains)) {
			domainLookupTable[domainValue] = normalizeTheLocale(locale);
		}
	}
	return {
		fallback: i18n.fallback,
		fallbackType: toFallbackType(i18n.routing),
		strategy: toRoutingStrategy(i18n.routing, i18n.domains),
		locales: i18n.locales,
		defaultLocale: i18n.defaultLocale,
		domainLookupTable,
		domains: i18n.domains,
	};
}
