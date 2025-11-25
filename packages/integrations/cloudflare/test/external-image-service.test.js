import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { glob } from 'tinyglobby';
import { loadFixture } from './_test-utils.js';

const root = new URL('./fixtures/external-image-service/', import.meta.url);

describe('ExternalImageService', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/external-image-service/',
		});
		await fixture.build();
	});

	it('has correct image service', async () => {
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
