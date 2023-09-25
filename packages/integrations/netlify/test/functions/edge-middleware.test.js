import { fileURLToPath } from 'url';
import { cli } from './test-utils.js';
import fs from 'fs/promises';
import { expect } from 'chai';

describe('Middleware', () => {
	it('with edge handle file, should successfully build the middleware', async () => {
		const root = new URL('./fixtures/middleware-with-handler-file/', import.meta.url).toString();
		await cli('build', '--root', fileURLToPath(root));
		const contents = await fs.readFile(new URL('./.netlify/edge-functions/edgeMiddleware.js', root), 'utf-8');
		expect(contents.includes('"Hello world"')).to.be.true;
	});

	it('without edge handle file, should successfully build the middleware', async () => {
		const root = new URL('./fixtures/middleware-without-handler-file/', import.meta.url).toString();
		await cli('build', '--root', fileURLToPath(root));
		const contents = await fs.readFile(new URL('./.netlify/edge-functions/edgeMiddleware.js', root), 'utf-8');
		expect(contents.includes('"Hello world"')).to.be.false;
	});
});
