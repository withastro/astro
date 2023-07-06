import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import testAdapter from './test-adapter.js';

describe('Adapter', () => {
	let fixture;

	it("should error if the adapter doesn't support edge middleware", async () => {
		try {
			fixture = await loadFixture({
				root: './fixtures/middleware-dev/',
				output: 'server',
				build: {
					excludeMiddleware: true,
				},
				adapter: testAdapter({
					extendAdapter: {
						supportsFeatures: {
							edgeMiddleware: 'Unsupported',
						},
					},
				}),
			});
			await fixture.build();
		} catch (e) {
			expect(e.toString()).to.contain(
				"The adapter my-ssr-adapter doesn't support the feature build.excludeMiddleware."
			);
		}
	});

	it("should error if the adapter doesn't support split build", async () => {
		try {
			fixture = await loadFixture({
				root: './fixtures/middleware-dev/',
				output: 'server',
				build: {
					split: true,
				},
				adapter: testAdapter({
					extendAdapter: {
						supportsFeatures: {
							functionPerPage: 'Unsupported',
						},
					},
				}),
			});
			await fixture.build();
		} catch (e) {
			expect(e.toString()).to.contain(
				"The adapter my-ssr-adapter doesn't support the feature build.split."
			);
		}
	});
});
