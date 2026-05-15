import fetchable from 'virtual:astro:fetchable';
import { manifest } from 'virtual:astro:manifest';
import { App } from '../../app.js';
const createApp = ({ streaming } = {}) => {
	const app = new App(manifest, streaming);
	app.setFetchHandler(fetchable);
	return app;
};
export { createApp };
