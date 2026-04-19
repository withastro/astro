import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Vercel Web Analytics', () => {
	describe('output: static', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/with-web-analytics-enabled/output-as-static/',
				output: 'static',
			});
			await fixture.build({});
		});

		it('ensures that Vercel Web Analytics is present in the header', async () => {
			const pageOne = await fixture.readFile('../.vercel/output/static/one/index.html');
			const pageTwo = await fixture.readFile('../.vercel/output/static/two/index.html');

			assert.match(pageOne, /\/_vercel\/insights\/script.js/);
			assert.match(pageTwo, /\/_vercel\/insights\/script.js/);
		});
	});
});
