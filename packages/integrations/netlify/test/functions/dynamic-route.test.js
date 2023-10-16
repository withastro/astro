import { expect } from 'chai';
import { cli } from './test-utils.js';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const root = new URL('./fixtures/dynamic-route/', import.meta.url).toString();

describe('Dynamic pages', () => {
	before(async () => {
		await cli('build', '--root', fileURLToPath(root));
	});

	it('Dynamic pages are included in the redirects file', async () => {
		const redir = await fs.readFile(new URL('./dist/_redirects', root), 'utf-8');
		expect(redir).to.match(/\/products\/:id/);
	});

	it('Prerendered routes are also included using placeholder syntax', async () => {
		const redir = await fs.readFile(new URL('./dist/_redirects', root), 'utf-8');
		expect(redir).to.include('/pets/:cat       /pets/:cat/index.html        200');
		expect(redir).to.include('/pets/:dog       /pets/:dog/index.html        200');
		expect(redir).to.include('/pets            /.netlify/functions/entry    200');
	});
});
