import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'astro';

const root = new URL('./fixtures/basic/', import.meta.url);

describe('SQLite collection storage in a build', () => {
	before(async () => {
		// Relative `file:` URLs start from the directory where Astro runs
		process.chdir(fileURLToPath(root));
		await build({ root: fileURLToPath(root), logLevel: 'error' });
	});

	it('renders pages from entries stored in SQLite', async () => {
		const html = await readFile(new URL('./dist/docs/intro/index.html', root), 'utf-8');

		assert.match(html, /<h1>Introduction<\/h1>/);
		assert.match(html, /Stored in SQLite\./);
	});
});
