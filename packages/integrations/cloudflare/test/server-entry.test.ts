import { describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';
import assert from 'node:assert/strict';

describe('Server entry', () => {
	let fixture: Fixture;
	it('should load the custom entry when using legacy entrypoint', async () => {
		fixture = await loadFixture({
			root: './fixtures/server-entry',
			output: 'server',
		});

		await fixture.build();

		assert.ok(fixture.pathExists('server/custom.mjs'));
	});
});
