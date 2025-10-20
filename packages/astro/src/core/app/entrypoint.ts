import { renderers } from 'virtual:astro:renderers';
import { routes } from 'virtual:astro:routes';
import { manifest as serializedManifest } from 'virtual:astro:serialized-manifest';
import type { RoutesList } from '../../types/astro.js';
import { App } from './app.js';
import type { BaseApp } from './base.js';
import { DevApp } from './dev/app.js';
import { createConsoleLogger } from './logging.js';
import type { RouteInfo } from './types.js';

const actions = async () => {
	// @ts-expect-error
	return await import('astro-internal:actions');
};
const manifest = Object.assign(serializedManifest, { renderers, actions });

export function getApp(dev = import.meta.env.DEV): BaseApp {
	if (dev) {
		const logger = createConsoleLogger('debug');
		return new DevApp(manifest, true, logger, { routes: routes.map((r) => r.routeData) });
	} else {
		return new App(manifest);
	}
}
