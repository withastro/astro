import url from 'url';
import path from 'path';
import { expect } from 'chai';
import { isWindows, loadFixture } from './test-utils.js';

describe('Static build: dir takes the URL path to the output directory', () => {
	/** @type {URL} */
	let checkDir;
	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/static-build-dir/',
			integrations: [
				{
					name: '@astrojs/dir',
					hooks: {
						'astro:build:done': ({ dir }) => {
							checkDir = dir;
						},
					},
				},
			],
		});
		await fixture.build();
	});
	it('dir takes the URL path to the output directory', async () => {
		const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
		const relativeDirPath = checkDir.pathname.replace(__dirname, '');

		// On Windows, it does not start with `/`, otherwise it starts with `/`.
		if (isWindows) {
			expect(checkDir.pathname.startsWith('/')).to.be.false;
		} else {
			expect(checkDir.pathname.startsWith('/')).to.be.true;
		}

		expect(relativeDirPath).to.be.equal('/fixtures/static-build-dir/dist/');
	});
});
