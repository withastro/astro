import { renderers } from 'virtual:astro:renderers';
import { routes } from 'virtual:astro:routes';
import { manifest as serializedManifest } from 'virtual:astro:serialized-manifest';
import { App } from './app.js';
import type { BaseApp } from './base.js';
import { DevApp } from './dev/app.js';
import { createConsoleLogger } from './logging.js';

const actions = async () => {
	return await import('virtual:astro:actions/entrypoint');
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
