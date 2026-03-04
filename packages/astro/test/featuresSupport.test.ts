import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { loadFixture } from './test-utils.ts';

describe('Adapter', () => {
	let fixture;

	it("should error if the adapter doesn't support edge middleware", async () => {
		try {
			fixture = await loadFixture({
				root: './fixtures/middleware space/',
				output: 'server',
				adapter: testAdapter({
					extendAdapter: {
						supportedAstroFeatures: {},
					},
				}),
			});
			await fixture.build();
		} catch (e) {
			assert.equal(
				e
					.toString()
					.includes("The adapter my-ssr-adapter doesn't support the feature build.middleware."),
				true,
			);
		}
	});

	it("should error if the adapter doesn't support split build", async () => {
		try {
			fixture = await loadFixture({
				root: './fixtures/middleware space/',
				output: 'server',
				adapter: testAdapter({
					extendAdapter: {
						supportedAstroFeatures: {},
					},
				}),
			});
			await fixture.build();
		} catch (e) {
			assert.equal(
				e
					.toString()
					.includes("The adapter my-ssr-adapter doesn't support the feature build.split."),
				true,
			);
		}
	});
});
