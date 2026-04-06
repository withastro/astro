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

	it('renders framework components in prerender-only server islands', async () => {
		const fixture = await loadFixture({
			root: './fixtures/server-island-prerender-framework/',
		});

		await fixture.build();
		const previewServer = await fixture.preview({
			server: {
				host: '127.0.0.1',
				port: 48081,
			},
		});

		try {
			const pageRes = await fixture.fetch('/');
			assert.equal(pageRes.status, 200);
			const pageHtml = await pageRes.text();

			const islandUrlMatch = /fetch\((["'])(\/_server-islands\/[^"']+)\1/.exec(pageHtml);
			assert.ok(
				islandUrlMatch,
				`Expected prerendered HTML to include server island fetch URL, got:\n${pageHtml}`,
			);

			const islandRes = await fixture.fetch(islandUrlMatch[2]);
			assert.equal(islandRes.status, 200);
			const islandHtml = await islandRes.text();

			assert.ok(
				islandHtml.includes('id="framework-content"'),
				`Expected framework content in server island response, got:\n${islandHtml}`,
			);
		} finally {
			await previewServer.stop();
			await fixture.clean();
		}
	});
});
