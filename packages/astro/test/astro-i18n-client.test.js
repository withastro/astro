import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('i18n client import', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/i18n-client-import/',
		});
	});

	it('should build successfully when importing astro:i18n in a client script', async () => {
		try {
			await fixture.build();
			assert.ok(true, 'Build should succeed');
		} catch (e) {
			assert.fail(`Build failed with error: ${e.message}`);
		}
	});
});
