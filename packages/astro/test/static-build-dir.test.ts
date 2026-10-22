import assert from 'node:assert/strict';
import fs from 'node:fs';
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
			outDir: './dist/static-build-dir/',
		});
		await fixture.build();
	});
	it('dir takes the URL path to the output directory', async () => {
		const removeTrailingSlash = (str: string) => str.replace(/\/$/, '');
		assert.equal(
			removeTrailingSlash(checkDir.toString()),
			removeTrailingSlash(
				new URL('./fixtures/static-build-dir/dist/static-build-dir', import.meta.url).toString(),
			),
		);
		assert.equal(checkDir.toString(), checkGeneratedDir.toString());
	});
});

describe('Static build: previous output', () => {
	const outDir = new URL('./fixtures/static-build-dir/dist/previous-output/', import.meta.url);
	before(async () => {
		fs.rmSync(outDir, { recursive: true, force: true });
		fs.mkdirSync(new URL('./stale/', outDir), { recursive: true });
		fs.writeFileSync(new URL('./stale/index.html', outDir), 'stale');
		fs.mkdirSync(new URL('./.git/', outDir));
		fs.writeFileSync(new URL('./.git/HEAD', outDir), 'ref: refs/heads/main');

		const fixture = await loadFixture({
			root: './fixtures/static-build-dir/',
			outDir: './dist/previous-output/',
		});
		await fixture.build();
	});

	it('is removed', () => {
		assert.ok(fs.existsSync(new URL('./index.html', outDir)));
		assert.ok(!fs.existsSync(new URL('./stale/', outDir)));
	});

	it('keeps a .git directory at the root of the output directory', () => {
		assert.equal(fs.readFileSync(new URL('./.git/HEAD', outDir), 'utf-8'), 'ref: refs/heads/main');
	});
});
