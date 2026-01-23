import { manifest } from 'virtual:astro:manifest';
import type { BaseApp } from './base.js';
import { DevApp } from './dev/app.js';
import { createConsoleLogger } from './logging.js';

export function createApp(): BaseApp {
	const logger = createConsoleLogger(manifest.logLevel);
	return new DevApp(manifest, true, logger);
}
