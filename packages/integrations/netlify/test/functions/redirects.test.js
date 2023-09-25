import { expect } from 'chai';
import fs from 'fs/promises';
import { cli } from './test-utils.js';
import { fileURLToPath } from 'url';

const root = new URL('../functions/fixtures/redirects/', import.meta.url).toString();

describe('SSG - Redirects', () => {
	before(async () => {
		await cli('build', '--root', fileURLToPath(root));
	});

	it('Creates a redirects file', async () => {
		let redirects = await fs.readFile(new URL('./dist/_redirects', root), 'utf-8');
		let parts = redirects.split(/\s+/);
		expect(parts).to.deep.equal([
			'/other',
			'/',
			'301',
			// This uses the dynamic Astro.redirect, so we don't know that it's a redirect
			// until runtime. This is correct!
			'/nope',
			'/.netlify/functions/entry',
			'200',
			'/',
			'/.netlify/functions/entry',
			'200',

			// Image endpoint
			'/_image',
			'/.netlify/functions/entry',
			'200',

			// A real route
			'/team/articles/*',
			'/.netlify/functions/entry',
			'200',
		]);
		expect(redirects).to.matchSnapshot();
	});

	it('Does not create .html files', async () => {
		try {
			await fixture.readFile('/other/index.html');
			expect(false).to.equal(true, 'this file should not exist');
		} catch {
			expect(true).to.equal(true);
		}
	});
});
