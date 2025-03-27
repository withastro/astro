import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { glob } from 'tinyglobby';
import { astroCli } from './_test-utils.js';

const root = new URL('./fixtures/external-image-service/', import.meta.url);

describe('ExternalImageService', () => {
	it('has correct image service', async () => {
		await astroCli(fileURLToPath(root), 'build');
		const files = await glob('**/image-service_*.mjs', {
			cwd: fileURLToPath(new URL('dist/_worker.js', root)),
			filesOnly: true,
			absolute: true,
			flush: true,
		});
		const outFileToCheck = readFileSync(files[0], 'utf-8');
		assert.equal(outFileToCheck.includes('cdn-cgi/image'), true);
	});
});
