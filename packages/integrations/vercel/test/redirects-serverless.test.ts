import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Redirects Serverless', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/redirects-serverless/',
			redirects: {
				'/one': '/',
				'/other': '/subpage',
			},
		});
		await fixture.build({});
	});

	it('does not create .html files', async () => {
		let hasErrored = false;
		try {
			await fixture.readFile('../.vercel/output/static/other/index.html');
		} catch {
			hasErrored = true;
		}
		assert.equal(hasErrored, true, 'this file should not exist');
	});
});
