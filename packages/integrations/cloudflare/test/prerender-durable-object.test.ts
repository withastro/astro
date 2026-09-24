import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Prerender with durable objects', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/prerender-durable-object/',
		});
		await fixture.build();
	});

	it('builds without ERR_RUNTIME_FAILURE when Cloudflare config has a Durable Object', () => {
		// Before the fix, this build crashed with:
		//   "Class extends value undefined is not a constructor or null"
		// because the Durable Object binding and export leaked into the prerender worker
		// config while its entrypoint was overridden with the default Astro entrypoint
		// (which does not export the user's Durable Object classes).
		assert.ok(fixture.pathExists('client'), 'Expected the client output to exist after build');
	});
});
