import * as assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { astroCli } from './_test-utils.js';

const root = new URL('./fixtures/prerender-optimizations/', import.meta.url);

async function lookForCodeInServerBundle(code) {
	const serverBundleRoot = fileURLToPath(new URL('./dist/_worker.js/', root));

	const entries = await readdir(serverBundleRoot, {
		withFileTypes: true,
		recursive: true,
	}).catch((err) => {
		console.log('Failed to read server bundle directory:', err);

		throw err;
	});

	for (const entry of entries) {
		if (!entry.isFile()) continue;

		const filePath = join(entry.path, entry.name);
		const fileContent = await readFile(filePath, 'utf-8').catch((err) => {
			console.log(`Failed to read file ${filePath}:`, err);

			throw err;
		});

		if (fileContent.includes(code)) {
			return relative(serverBundleRoot, filePath);
		}
	}

	return null;
}

describe('worker.js cleanup after pre-rendering', () => {
	before(async () => {
		const res = await astroCli(fileURLToPath(root), 'build');
	});

	it('should not include code from pre-rendered pages in the server bundle', async () => {
		assert.equal(
			await lookForCodeInServerBundle('frontmatter of prerendered page'),
			null,
			'Code from pre-rendered pages should not be included in the server bundle.'
		);

		assert.equal(
			await lookForCodeInServerBundle('Body of Prerendered Page'),
			null,
			'Code from pre-rendered pages should not be included in the server bundle.'
		);
	});

	it('should not include markdown content used only in pre-rendered pages in the server bundle', async () => {
		assert.equal(
			await lookForCodeInServerBundle('Sample Post Title'),
			null,
			'Markdown frontmatter used only on pre-rendered pages should not be included in the server bundle.'
		);

		assert.equal(
			await lookForCodeInServerBundle('Sample Post Content'),
			null,
			'Markdown content used only on pre-rendered pages should not be included in the server bundle.'
		);
	});

	it('should include code for on-demand pages in the server bundle', async () => {
		assert.notEqual(
			await lookForCodeInServerBundle('frontmatter of SSR page'),
			null,
			'Code from pre-rendered pages should not be included in the server bundle.'
		);

		assert.notEqual(
			await lookForCodeInServerBundle('Body of SSR Page'),
			null,
			'Code from pre-rendered pages should not be included in the server bundle.'
		);
	});
});
