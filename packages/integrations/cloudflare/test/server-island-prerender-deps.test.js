import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadFixture } from './_test-utils.js';

async function readFilesRecursive(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				return readFilesRecursive(fullPath);
			}
			return [fullPath];
		}),
	);
	return files.flat();
}

describe('Cloudflare server island prerender dependencies', () => {
	it('bundles third-party imports for prerender-only server islands', async () => {
		const fixture = await loadFixture({
			root: './fixtures/server-island-prerender-deps/',
		});

		await fixture.build();

		const serverOutputDir = fileURLToPath(fixture.config.build.server);
		const outputFiles = await readFilesRecursive(serverOutputDir);
		const islandChunkPath = outputFiles.find((file) => {
			const normalized = file.replaceAll(path.sep, '/');
			return normalized.includes('/chunks/Island_') && normalized.endsWith('.mjs');
		});

		assert.ok(islandChunkPath, 'Server island chunk should be emitted');

		const islandChunkCode = await fs.readFile(islandChunkPath, 'utf-8');
		assert.equal(
			islandChunkCode.includes("from 'devalue'") || islandChunkCode.includes('from "devalue"'),
			false,
			`Server island chunk should not keep bare devalue imports:\n${islandChunkCode}`,
		);
	});
});
