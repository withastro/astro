import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Adapter', () => {
	let fixture: Fixture;

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
				outDir: './dist/featuresSupport-adapter/',
				cacheDir: './node_modules/.astro-test/featuresSupport-adapter/',
			});
			await fixture.build();
		} catch (e) {
			assert.equal(
				String(e).includes(
					"The adapter my-ssr-adapter doesn't support the feature build.middleware.",
				),
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
				outDir: './dist/featuresSupport-adapter/',
				cacheDir: './node_modules/.astro-test/featuresSupport-adapter/',
			});
			await fixture.build();
		} catch (e) {
			assert.equal(
				String(e).includes("The adapter my-ssr-adapter doesn't support the feature build.split."),
				true,
			);
		}
	});
});
