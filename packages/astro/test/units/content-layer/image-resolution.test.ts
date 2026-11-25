import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGE_IMPORT_PREFIX } from '../../../dist/content/consts.js';
import { image, resolveImageField } from '../../../dist/content/image.js';
import { getEntryData } from '../../../dist/content/utils.js';

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

	it('returns a synchronous marker without image metadata or entry context', () => {
		const result = image('cover.jpg');
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}cover.jpg`);
		assert.equal(result.width, undefined);
	});

	it('resolves a sibling file and reads its dimensions after validation', async () => {
		const result = await resolveImageField(image('cover.jpg'), entryFilePath);
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}./cover.jpg`);
		assert.equal(result.width, 600);
		assert.equal(result.height, 400);
	});

	it('resolves image markers for entries without a schema', async () => {
		const result = await getEntryData(
			{
				id: 'post',
				collection: 'posts',
				unvalidatedData: { cover: image('cover.jpg') },
				_internal: { rawData: undefined, filePath: entryFilePath },
			},
			{ type: 'content_layer', loader: { name: 'test', load: () => {} } },
			false,
		);
		assert.equal(result.cover.width, 600);
		assert.equal(result.cover.height, 400);
	});

	it('keeps an explicit relative source unchanged', async () => {
		const result = await resolveImageField(image('./cover.jpg'), entryFilePath);
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}./cover.jpg`);
		assert.equal(result.width, 600);
	});

	it('reports a missing relative source after validation', async () => {
		await assert.rejects(
			() => resolveImageField(image('./missing.jpg'), entryFilePath),
			/Could not find requested image/,
		);
	});

	it('passes a remote URL through without reading it', async () => {
		const result = await resolveImageField(image('https://example.com/cover.jpg'), entryFilePath);
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}https://example.com/cover.jpg`);
		assert.equal(result.width, undefined);
	});

	it('resolves an aliased source with the provided resolver', async () => {
		const result = await resolveImageField(
			image('@images/cover.jpg'),
			entryFilePath,
			async (source) => (source === '@images/cover.jpg' ? coverPath : undefined),
		);
		assert.equal(result.width, 600);
	});

	it('defers an unresolved source to read time when no resolver is available', async () => {
		const result = await resolveImageField(image('not-a-file'), entryFilePath);
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}not-a-file`);
		assert.equal(result.width, undefined);
	});

	it('reports an alias the resolver cannot resolve', async () => {
		await assert.rejects(
			() => resolveImageField(image('@missing/x.jpg'), entryFilePath, async () => undefined),
			/Could not find requested image/,
		);
	});

	it('defers to read time when the entry has no file path', async () => {
		const result = await resolveImageField(image('./cover.jpg'), undefined);
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}./cover.jpg`);
		assert.equal(result.width, undefined);
	});
});
