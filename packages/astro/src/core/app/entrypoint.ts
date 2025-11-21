import { manifest } from 'virtual:astro:manifest';
import { App } from './app.js';
import type { BaseApp } from './base.js';
import { DevApp } from './dev/app.js';
import { createConsoleLogger } from './logging.js';

export function createApp(dev = import.meta.env.DEV): BaseApp {
	if (dev) {
		const logger = createConsoleLogger(manifest.logLevel);
		return new DevApp(manifest, true, logger);
	} else {
		return new App(manifest);
	}
}
