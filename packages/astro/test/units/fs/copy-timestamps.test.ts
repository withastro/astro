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
});
