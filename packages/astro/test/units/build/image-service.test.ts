import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, it } from 'node:test';
import { loadBuildImageService } from '../../../dist/core/build/image-service.js';
import type { AstroSettings } from '../../../dist/types/astro.js';

function createMockSettings(serverDir: URL): AstroSettings {
	return {
		buildOutput: 'server',
		config: {
			build: {
				server: serverDir,
			},
			image: {
				service: {
					entrypoint: 'astro/assets/services/sharp',
					config: {},
				},
			},
		},
	} as unknown as AstroSettings;
}

describe('loadBuildImageService', () => {
	it('imports the image-service entry chunk even when another entry chunk appears first', async () => {
		const tempRoot = await mkdtemp(join(tmpdir(), 'astro-image-service-test-'));
		try {
			const outDir = pathToFileURL(join(tempRoot, 'dist') + '/');
			const imageServiceDir = new URL('./.prerender/image-service/', outDir);
			await mkdir(new URL('./chunks/', imageServiceDir), { recursive: true });

			// Simulates a browser-only before-hydration script emitted ahead of the image service chunk
			await writeFile(
				new URL('./chunks/before-hydration.mjs', imageServiceDir),
				'throw new ReferenceError("document is not defined");\n',
			);
			await writeFile(
				new URL('./image-service.test.mjs', imageServiceDir),
				'export default { transform: async (buf) => ({ data: buf, format: "webp" }) };\n',
			);

			const builder = {
				environments: { astroImageService: {} },
				async build() {
					return {
						output: [
							{
								type: 'chunk',
								isEntry: true,
								fileName: 'chunks/before-hydration.mjs',
								facadeModuleId: 'astro:scripts/before-hydration.js',
							},
							{
								type: 'chunk',
								isEntry: true,
								fileName: 'image-service.test.mjs',
								facadeModuleId: '\0virtual:astro:image-service-entry',
							},
						],
					};
				},
			} as any;

			const service = await loadBuildImageService(builder, createMockSettings(outDir));
			assert.equal(typeof service.transform, 'function');
		} finally {
			await rm(tempRoot, { recursive: true, force: true });
		}
	});

	it('throws InvalidImageService when the image-service entry chunk is missing', async () => {
		const tempRoot = await mkdtemp(join(tmpdir(), 'astro-image-service-test-'));
		try {
			const outDir = pathToFileURL(join(tempRoot, 'dist') + '/');
			const builder = {
				environments: { astroImageService: {} },
				async build() {
					return {
						output: [
							{
								type: 'chunk',
								isEntry: true,
								fileName: 'chunks/before-hydration.mjs',
								facadeModuleId: 'astro:scripts/before-hydration.js',
							},
						],
					};
				},
			} as any;

			await assert.rejects(
				() => loadBuildImageService(builder, createMockSettings(outDir)),
				(err: any) => err?.name === 'InvalidImageService',
			);
		} finally {
			await rm(tempRoot, { recursive: true, force: true });
		}
	});
});
