import netlifyAdapter from '../../dist/index.js';
import { testIntegration, loadFixture } from './test-utils.js';
import { expect } from 'chai';
import chaiJestSnapshot from 'chai-jest-snapshot';

describe('Middleware', () => {
	it('with edge handle file, should successfully build the middleware', async () => {
		/** @type {import('./test-utils').Fixture} */
		const fixture = await loadFixture({
			root: new URL('./fixtures/middleware-with-handler-file/', import.meta.url).toString(),
			output: 'server',
			adapter: netlifyAdapter({
				dist: new URL('./fixtures/middleware-with-handler-file/dist/', import.meta.url),
			}),
			site: `http://example.com`,
			integrations: [testIntegration()],
			build: {
				excludeMiddleware: true,
			},
		});
		await fixture.build();
		const contents = await fixture.readFile('../.netlify/edge-functions/edgeMiddleware.mjs');
		expect(contents.includes('title:')).to.be.true;
		chaiJestSnapshot.setTestName('Middleware with handler file');
		expect(contents).to.matchSnapshot(true);
	});

	it('without edge handle file, should successfully build the middleware', async () => {
		/** @type {import('./test-utils').Fixture} */
		const fixture = await loadFixture({
			root: new URL('./fixtures/middleware-without-handler-file/', import.meta.url).toString(),
			output: 'server',
			adapter: netlifyAdapter({
				dist: new URL('./fixtures/middleware-without-handler-file/dist/', import.meta.url),
			}),
			site: `http://example.com`,
			integrations: [testIntegration()],
			build: {
				excludeMiddleware: true,
			},
		});
		await fixture.build();
		const contents = await fixture.readFile(
			// this is abysmal...
			'../.netlify/edge-functions/edgeMiddleware.mjs'
		);
		expect(contents.includes('title:')).to.be.false;
		chaiJestSnapshot.setTestName('Middleware with handler file');
		expect(contents).to.matchSnapshot(true);
	});
});
