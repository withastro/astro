import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

function getClientFileUrl(fixture, pathname) {
	return new URL(pathname.replace(/^\//, ''), fixture.config.build.client);
}

describe('i18n fallback rewrites in hybrid builds', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/i18n-routing-fallback-rewrite-hybrid/',
		});
		await fixture.build();
	});

	it('writes fallback locale pages into the client build output', async () => {
		await assert.doesNotReject(fs.access(getClientFileUrl(fixture, '/es/slug-1/index.html')));
		await assert.doesNotReject(fs.access(getClientFileUrl(fixture, '/es/slug-2/index.html')));

		const fallbackSlug1 = await fs.readFile(getClientFileUrl(fixture, '/es/slug-1/index.html'), 'utf8');
		const fallbackSlug2 = await fs.readFile(getClientFileUrl(fixture, '/es/slug-2/index.html'), 'utf8');

		assert.match(fallbackSlug1, /slug-1 - es/);
		assert.match(fallbackSlug2, /slug-2 - es/);
	});
});
