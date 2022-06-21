import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

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
		const removeTrailingSlash = (str) => str.replace(/\/$/, '');
		expect(removeTrailingSlash(checkDir.toString())).to.be.equal(
			removeTrailingSlash(new URL('./fixtures/static-build-dir/dist', import.meta.url).toString())
		);
	});
});
