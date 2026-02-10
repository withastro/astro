import { manifest } from 'virtual:astro:manifest';
import type { BaseApp } from '../base.js';
import { App } from '../app.js';

export function createApp(): BaseApp {
	return new App(manifest);
}
