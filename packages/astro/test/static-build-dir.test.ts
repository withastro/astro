import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.ts';

describe('Static build: dir takes the URL path to the output directory', () => {
	let checkDir: URL;
	let checkGeneratedDir: URL;
	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/static-build-dir/',
			integrations: [
				{
					name: '@astrojs/dir',
					hooks: {
						'astro:build:generated': ({ dir }) => {
							checkGeneratedDir = dir;
						},
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
		const removeTrailingSlash = (str: string) => str.replace(/\/$/, '');
		assert.equal(
			removeTrailingSlash(checkDir.toString()),
			removeTrailingSlash(new URL('./fixtures/static-build-dir/dist', import.meta.url).toString()),
		);
		assert.equal(checkDir.toString(), checkGeneratedDir.toString());
	});
});
