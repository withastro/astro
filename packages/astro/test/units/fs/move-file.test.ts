import * as assert from 'node:assert/strict';
import fs from 'node:fs';
import { afterEach, describe, it, mock } from 'node:test';
import { moveFile } from '../../../dist/core/fs/index.js';
import { createFixture } from '../test-utils.ts';

describe('moveFile', () => {
	afterEach(() => {
		mock.restoreAll();
	});

	it('moves a file', async () => {
		const fixture = await createFixture({
			'/src/image.png': 'image',
			'/dest/.gitkeep': '',
		});
		const source = fixture.getPath('src/image.png');
		const destination = fixture.getPath('dest/image.png');

		await moveFile(source, destination);

		assert.equal(fs.readFileSync(destination, 'utf-8'), 'image');
		assert.equal(fs.existsSync(source), false);

		await fixture.rm();
	});

	it('copies and removes the file when the destination is on another filesystem', async () => {
		const fixture = await createFixture({
			'/src/image.png': 'image',
			'/dest/.gitkeep': '',
		});
		const source = fixture.getPath('src/image.png');
		const destination = fixture.getPath('dest/image.png');
		// A real second filesystem is not available in CI, so `rename` fails the way it does across devices.
		const rename = mock.method(fs.promises, 'rename', async () => {
			throw Object.assign(new Error('EXDEV: cross-device link not permitted'), { code: 'EXDEV' });
		});

		await moveFile(source, destination);

		assert.equal(rename.mock.callCount(), 1);
		assert.equal(fs.readFileSync(destination, 'utf-8'), 'image');
		assert.equal(fs.existsSync(source), false);

		await fixture.rm();
	});

	it('rethrows other rename errors', async () => {
		const fixture = await createFixture({
			'/src/image.png': 'image',
			'/dest/.gitkeep': '',
		});
		const source = fixture.getPath('src/image.png');
		const destination = fixture.getPath('dest/image.png');
		mock.method(fs.promises, 'rename', async () => {
			throw Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' });
		});

		await assert.rejects(moveFile(source, destination), { code: 'EACCES' });
		assert.equal(fs.existsSync(destination), false);
		assert.equal(fs.existsSync(source), true);

		await fixture.rm();
	});
});
