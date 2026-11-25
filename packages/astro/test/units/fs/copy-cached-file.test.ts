import * as assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';
import { copyCachedFile } from '../../../dist/core/fs/index.js';
import { createFixture } from '../test-utils.ts';

describe('copyCachedFile', () => {
	it('preserves the modification time of the cached file', async () => {
		const fixture = await createFixture({
			'/cache/image.webp': 'cached',
			'/dist/.gitkeep': '',
		});
		const source = fixture.getPath('cache/image.webp');
		const destination = fixture.getPath('dist/image.webp');
		const cachedAt = new Date('2020-01-01T00:00:00Z');
		fs.utimesSync(source, cachedAt, cachedAt);

		await copyCachedFile(source, destination);

		assert.equal(fs.readFileSync(destination, 'utf-8'), 'cached');
		assert.equal(fs.statSync(destination).mtime.getTime(), cachedAt.getTime());
	});
});
