import { renderers } from 'virtual:astro:renderers';
import { routes } from 'virtual:astro:routes';
import { manifest as serializedManifest } from 'virtual:astro:serialized-manifest';
import { App } from './app.js';
import type { BaseApp } from './base.js';
import { DevApp } from './dev/app.js';
import { createConsoleLogger } from './logging.js';
import type { SSRManifest } from './types.js';

const actions = async () => {
	return await import('virtual:astro:actions/entrypoint');
};

const middleware = async () => {
	return await import('virtual:astro:middleware');
};

const manifest: SSRManifest = Object.assign(serializedManifest, {
	renderers,
	actions,
	middleware,
	routes,
});

export function getApp(dev = import.meta.env.DEV): BaseApp {
	if (dev) {
		const logger = createConsoleLogger('debug');
		return new DevApp(manifest, true, logger);
	} else {
		return new App(manifest);
	}
}
