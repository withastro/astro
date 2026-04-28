import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('Custom 404 with injectRoute from dependency', () => {
	describe('build', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/custom-404-injected-from-dep/',
				site: 'http://example.com',
			});
			await fixture.build();
		});

		it('Build succeeds', async () => {
			const html = await fixture.readFile('/404.html');
			assert.equal(html.includes('<!DOCTYPE html>'), true);
		});
	});
});
