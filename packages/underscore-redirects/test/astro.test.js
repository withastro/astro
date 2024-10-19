import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRedirectsFromAstroRoutes } from '../dist/index.js';

describe('Astro', () => {
	const serverConfig = {
		output: 'server',
		build: { format: 'directory' },
	};

	it('Creates a Redirects object from routes', () => {
		const routeToDynamicTargetMap = new Map(
			Array.from([
				[
					{ pathname: '/', distURL: new URL('./index.html', import.meta.url), segments: [] },
					'./.adapter/dist/entry.mjs',
				],
				[
					{ pathname: '/one', distURL: new URL('./one/index.html', import.meta.url), segments: [] },
					'./.adapter/dist/entry.mjs',
				],
			]),
		);
		const _redirects = createRedirectsFromAstroRoutes({
			config: serverConfig,
			routeToDynamicTargetMap,
			dir: new URL(import.meta.url),
		});

		assert.equal(_redirects.definitions.length, 2);
	});
});
