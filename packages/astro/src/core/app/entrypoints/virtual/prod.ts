import fetchable from 'virtual:astro:fetchable';
import { manifest } from 'virtual:astro:manifest';
import type { CreateApp } from '../../types.js';
import { App } from '../../app.js';

export const createApp: CreateApp = ({ streaming } = {}) => {
	const app = new App(manifest, streaming);
	app.setFetchHandler(fetchable);
	return app;
};
