import { manifest } from 'virtual:astro:manifest';
import { App } from './app.js';
import type { BaseApp } from './base.js';

export function createApp(): BaseApp {
	return new App(manifest);
}
