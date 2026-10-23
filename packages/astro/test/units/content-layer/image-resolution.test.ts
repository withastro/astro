import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGE_IMPORT_PREFIX } from '../../../dist/content/consts.js';
import { image, withContentImageResolver } from '../../../dist/content/image.js';

const coverFixture = fileURLToPath(new URL('../assets/600x400.jpg', import.meta.url));

describe('image() source resolution', () => {
	let dir: string;
	let entryFilePath: string;
	let coverPath: string;

	before(async () => {
		dir = await fs.mkdtemp(path.join(os.tmpdir(), 'astro-image-resolution-'));
		entryFilePath = path.join(dir, 'post.md');
		coverPath = path.join(dir, 'cover.jpg');
		await fs.writeFile(entryFilePath, '');
		await fs.copyFile(coverFixture, coverPath);
	});

	after(async () => {
		await fs.rm(dir, { recursive: true, force: true });
	});

	it('resolves a sibling file and reads its dimensions', async () => {
		const result = await image({ filePath: entryFilePath }, { src: 'cover.jpg' });
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}./cover.jpg`);
		assert.equal(result.width, 600);
		assert.equal(result.height, 400);
	});

	it('keeps an explicit relative source unchanged', async () => {
		const result = await image({ filePath: entryFilePath }, { src: './cover.jpg' });
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}./cover.jpg`);
		assert.equal(result.width, 600);
	});

	it('reports a missing relative source', async () => {
		await assert.rejects(
			() => image({ filePath: entryFilePath }, { src: './missing.jpg' }),
			/Could not find requested image/,
		);
	});

	it('passes a remote URL through without reading it', async () => {
		const result = await withContentImageResolver(
			async () => {
				throw new Error('the resolver must not run for a remote source');
			},
			() => image({ filePath: entryFilePath }, { src: 'https://example.com/cover.jpg' }),
		);
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}https://example.com/cover.jpg`);
		assert.equal(result.width, undefined);
	});

	it('defers an unresolved source to read time when no resolver is installed', async () => {
		const result = await image({ filePath: entryFilePath }, { src: 'not-a-file' });
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}not-a-file`);
		assert.equal(result.width, undefined);
	});

	it('resolves an alias through the ambient resolver', async () => {
		const result = await withContentImageResolver(
			async (source) => (source === '@images/cover.jpg' ? coverPath : undefined),
			() => image({ filePath: entryFilePath }, { src: '@images/cover.jpg' }),
		);
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}@images/cover.jpg`);
		assert.equal(result.width, 600);
	});

	it('resolves a root-absolute source through the ambient resolver', async () => {
		const result = await withContentImageResolver(
			async (source) => (source === '/cover.jpg' ? coverPath : undefined),
			() => image({ filePath: entryFilePath }, { src: '/cover.jpg' }),
		);
		assert.equal(result.width, 600);
	});

	it('reports an alias the resolver cannot resolve', async () => {
		await assert.rejects(
			() =>
				withContentImageResolver(
					async () => undefined,
					() => image({ filePath: entryFilePath }, { src: '@missing/x.jpg' }),
				),
			/Could not find requested image/,
		);
	});

	it('defers to read time when the context has no file path', async () => {
		const result = await image({}, { src: './cover.jpg' });
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}./cover.jpg`);
		assert.equal(result.width, undefined);
	});

	it('rejects a call without the schema context', async () => {
		await assert.rejects(
			() => image(undefined as never, { src: './cover.jpg' }),
			/must be called with the schema context/,
		);
	});
});
