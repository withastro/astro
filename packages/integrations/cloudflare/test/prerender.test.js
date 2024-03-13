import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { astroCli } from './_test-utils.js';

const root = new URL('./fixtures/prerender/', import.meta.url);

describe('Prerendering', () => {
	before(async () => {
		await astroCli(fileURLToPath(root), 'build');
	});

	it('includes non prerendered routes in the routes.json config', async () => {
		const foundRoutes = JSON.parse(readFileSync(fileURLToPath(new URL('dist/_routes.json', root))));

		assert.deepEqual(foundRoutes, {
			version: 1,
			include: ['/', '/_image'],
			exclude: [],
		});
	});
});
