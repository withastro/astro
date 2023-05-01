import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('Integrations can hook into the prerendering decision', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	const testIntegration = {
		name: 'test prerendering integration',
		hooks: {
			['astro:build:setup']({ pages, target }) {
				if (target !== 'client') return;
				// this page has `export const prerender = true`
				pages.get('src/pages/static.astro').route.prerender = false
				
				// this page does not
				pages.get('src/pages/not-prerendered.astro').route.prerender = true
			}
		}
	}

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-prerender/',
			output: 'server',
			integrations: [testIntegration],
			adapter: testAdapter(),
		});
		await fixture.build();
	});
	
	it('An integration can override the prerender flag', async () => {
		// test adapter only hosts dynamic routes
		// /static is expected to become dynamic
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/static');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
	});

	it('An integration can turn a normal page to a prerendered one', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/not-prerendered');
		const response = await app.render(request);
		expect(response.status).to.equal(404);
	});
});
