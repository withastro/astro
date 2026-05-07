import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Adapter', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware space/',
			output: 'server',
			adapter: testAdapter({
				extendAdapter: {
					supportedAstroFeatures: {},
				},
			}),
		});
	});

	it("should error if the adapter doesn't support edge middleware", async () => {
		try {
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
			await fixture.build();
		} catch (e) {
			assert.equal(
				String(e).includes("The adapter my-ssr-adapter doesn't support the feature build.split."),
				true,
			);
		}
	});
});
