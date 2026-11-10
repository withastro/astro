import type { RouterRegistry } from '@astrojs/vite-plugin-router/_internal/registry.js';
import {
	isMiddlewarePath,
	MIDDLEWARE_MODULE_ID,
	vitePluginMiddleware as routerVitePluginMiddleware,
} from '@astrojs/vite-plugin-router/_internal/core/middleware/vite-plugin.js';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { MissingMiddlewareForInternationalization } from '@astrojs/runtime/_internal/core/errors/errors-data.js';
import { AstroError } from '@astrojs/runtime/_internal/core/errors/index.js';

export { isMiddlewarePath, MIDDLEWARE_MODULE_ID };

export function vitePluginMiddleware({
	settings,
	routerRegistry,
}: {
	settings: AstroSettings;
	routerRegistry: RouterRegistry;
}): VitePlugin {
	return routerVitePluginMiddleware({
		routerRegistry,
		validate({ userMiddlewareIsPresent }) {
			if (!userMiddlewareIsPresent && settings.config.i18n?.routing === 'manual') {
				throw new AstroError(MissingMiddlewareForInternationalization);
			}
		},
	});
}
