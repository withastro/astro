import { expect } from 'chai';
import fs from 'fs/promises';
import { cli } from './test-utils.js';
import { fileURLToPath } from 'url';

const root = new URL('./fixtures/404/', import.meta.url).toString();

describe('404 page', () => {

	before(async () => {
		await cli('build', '--root', fileURLToPath(root));
	});

	it('404 route is included in the redirect file', async () => {
		const redir = await fs.readFile(new URL('./dist/_redirects', root), 'utf-8');
		const expr = new RegExp('/*    /.netlify/functions/entry    404');
		expect(redir).to.match(expr);
	});
});
