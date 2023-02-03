import { expect } from 'chai';
import netlifyAdapter from '../../dist/index.js';
import { loadFixture, testIntegration } from './test-utils.js';

describe('Support polyfills', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/polyfills/', import.meta.url).toString(),
			output: 'server',
			adapter: netlifyAdapter({
				dist: new URL('./fixtures/polyfills/dist/', import.meta.url),
			}),
			site: `http://example.com`,
			integrations: [testIntegration()],
		});
		await fixture.build();
	});

	it('starts with the polyfill import', async () => {
		const entry = await fixture.readFile('../.netlify/functions-internal/entry.mjs');
		expect(entry).to.satisfy((content) =>
			content.startsWith("import '@astrojs/webapi/polyfill-ssr.js';")
		);
	});
});
