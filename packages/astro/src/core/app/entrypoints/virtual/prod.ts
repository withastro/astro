import { manifest } from 'virtual:astro:manifest';
import userApp from 'astro:user-app';
import type { CreateApp } from '../../types.js';
import { App } from '../../app.js';

export const createApp: CreateApp = ({ streaming } = {}) => {
	const app = new App(manifest, streaming);
	app.setUserApp(userApp);
	return app;
};
