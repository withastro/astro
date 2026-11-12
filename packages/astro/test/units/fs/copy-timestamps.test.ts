import * as assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { describe, it } from 'node:test';
import { copyTimestamps } from '../../../dist/core/fs/index.js';
import { createFixture } from '../test-utils.ts';

describe('copyTimestamps', () => {
	it('applies source modification times to matching files in nested directories', async () => {
		const fixture = await createFixture({
			'/public/favicon.svg': 'svg',
			'/public/nested/file.txt': 'txt',
			'/public/missing.txt': 'missing',
			'/dist/favicon.svg': 'svg',
			'/dist/nested/file.txt': 'txt',
			'/dist/index.html': 'html',
		});
		const modifiedAt = new Date('2020-01-01T00:00:00Z');
		fs.utimesSync(fixture.getPath('public/favicon.svg'), modifiedAt, modifiedAt);
		fs.utimesSync(fixture.getPath('public/nested/file.txt'), modifiedAt, modifiedAt);
		const htmlMtime = fs.statSync(fixture.getPath('dist/index.html')).mtime.getTime();

		await copyTimestamps(
			pathToFileURL(fixture.getPath('public/')),
			pathToFileURL(fixture.getPath('dist/')),
		);

		assert.equal(
			fs.statSync(fixture.getPath('dist/favicon.svg')).mtime.getTime(),
			modifiedAt.getTime(),
		);
		assert.equal(
			fs.statSync(fixture.getPath('dist/nested/file.txt')).mtime.getTime(),
			modifiedAt.getTime(),
		);
		assert.equal(fs.statSync(fixture.getPath('dist/index.html')).mtime.getTime(), htmlMtime);
		assert.equal(fs.existsSync(fixture.getPath('dist/missing.txt')), false);
	});

	it('does not backdate overwritten bytes, including differences after the first block', async () => {
		const fixture = await createFixture({
			'/public/same-size.txt': 'old',
			'/dist/same-size.txt': 'new',
			'/public/large.bin': 'a'.repeat(128 * 1024),
			'/dist/large.bin': `${'a'.repeat(128 * 1024 - 1)}b`,
			'/public/empty.txt': '',
			'/dist/empty.txt': '',
			'/public/unchanged.bin': 'b'.repeat(128 * 1024 + 3),
			'/dist/unchanged.bin': 'b'.repeat(128 * 1024 + 3),
		});
		const cachedAt = new Date('2020-01-01T00:00:00Z');
		const generatedAt = new Date('2024-01-01T00:00:00Z');
		for (const name of ['same-size.txt', 'large.bin', 'empty.txt', 'unchanged.bin']) {
			fs.utimesSync(fixture.getPath(`public/${name}`), cachedAt, cachedAt);
			fs.utimesSync(fixture.getPath(`dist/${name}`), generatedAt, generatedAt);
		}
		await copyTimestamps(
			pathToFileURL(fixture.getPath('public/')),
			pathToFileURL(fixture.getPath('dist/')),
		);
		for (const name of ['same-size.txt', 'large.bin']) {
			assert.equal(fs.statSync(fixture.getPath(`dist/${name}`)).mtimeMs, generatedAt.getTime());
		}
		for (const name of ['empty.txt', 'unchanged.bin']) {
			assert.equal(fs.statSync(fixture.getPath(`dist/${name}`)).mtimeMs, cachedAt.getTime());
		}
	});

	it('skips missing directories and file/directory collisions', async () => {
		const fixture = await createFixture({
			'/public/file': 'file',
			'/dist/file/child': 'child',
			'/public/dir/child': 'child',
			'/dist/dir': 'file',
		});
		const previous = fs.statSync(fixture.getPath('dist/file')).mtimeMs;
		await copyTimestamps(
			pathToFileURL(fixture.getPath('missing/')),
			pathToFileURL(fixture.getPath('dist/')),
		);
		await copyTimestamps(
			pathToFileURL(fixture.getPath('public/')),
			pathToFileURL(fixture.getPath('dist/')),
		);
		assert.equal(fs.statSync(fixture.getPath('dist/file')).mtimeMs, previous);
	});

	it('does not follow output symlinks or change files outside the output', {
		skip: process.platform === 'win32',
	}, async () => {
		const fixture = await createFixture({
			'/public/link.txt': 'same',
			'/public/linked-dir/file.txt': 'same',
			'/outside/file.txt': 'same',
			'/dist/.keep': '',
		});
		const cachedAt = new Date('2020-01-01T00:00:00Z');
		const generatedAt = new Date('2024-01-01T00:00:00Z');
		fs.utimesSync(fixture.getPath('public/link.txt'), cachedAt, cachedAt);
		fs.utimesSync(fixture.getPath('public/linked-dir/file.txt'), cachedAt, cachedAt);
		fs.utimesSync(fixture.getPath('outside/file.txt'), generatedAt, generatedAt);
		fs.symlinkSync('../outside/file.txt', fixture.getPath('dist/link.txt'));
		fs.symlinkSync('../outside', fixture.getPath('dist/linked-dir'), 'dir');
		await copyTimestamps(
			pathToFileURL(fixture.getPath('public/')),
			pathToFileURL(fixture.getPath('dist/')),
		);
		assert.equal(fs.statSync(fixture.getPath('outside/file.txt')).mtimeMs, generatedAt.getTime());
	});
});
