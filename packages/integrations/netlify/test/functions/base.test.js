import { expect } from 'chai';
import fs from 'fs/promises';
import { cli } from './test-utils.js';
import { fileURLToPath } from 'url';

const root = new URL('./fixtures/base/', import.meta.url).toString();

describe('Base', () => {
	before(async () => {
		await cli('build', '--root', fileURLToPath(root));
	});

	it('Path is prepended by base', async () => {
		const redir = await fs.readFile(new URL('./dist/_redirects', root), 'utf-8');
		const baseRouteIndex = redir.indexOf('/test/          /.netlify/functions/entry    200');
		const imageEndpoint = redir.indexOf('/test/_image    /.netlify/functions/entry    200');

		expect(baseRouteIndex).to.not.be.equal(-1);
		expect(imageEndpoint).to.not.be.equal(-1);
	});
});
