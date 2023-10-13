import { readFileSync } from 'fs';
import { astroCli } from './_test-utils.js';
import { expect } from 'chai';
import { fileURLToPath } from 'url';

const root = new URL('./fixtures/hybrid/', import.meta.url);

describe('Hybrid rendering', () => {
	before(async () => {
		await astroCli(fileURLToPath(root), 'build');
	});

	it('includes non prerendered routes in the routes.json config', async () => {
		const foundRoutes = JSON.parse(readFileSync(fileURLToPath(new URL('dist/_routes.json', root))));

		expect(foundRoutes).to.deep.equal({
			version: 1,
			include: ['/one', '/_image'],
			exclude: [],
		});
	});
});
