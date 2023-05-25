import { createRedirectsFromAstroRoutes } from '../dist/index.js';
import { expect } from 'chai';

describe('Astro', () => {
	const serverConfig = {
		output: 'server',
		build: { format: 'directory' }
	};

	it('Creates a Redirects object from routes', () => {
		const routes = [
			{ pathname: '/', distURL: new URL('./index.html', import.meta.url), segments: [] },
			{ pathname: '/one', distURL: new URL('./one/index.html', import.meta.url), segments: [] }
		];
		const dynamicTarget = './.adapter/dist/entry.mjs';
		const _redirects = createRedirectsFromAstroRoutes({
			config: serverConfig,
			routes,
			dir: new URL(import.meta.url),
			dynamicTarget
		});

		expect(_redirects.definitions).to.have.a.lengthOf(2);
	});
});
