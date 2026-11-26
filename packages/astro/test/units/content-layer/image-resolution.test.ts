import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGE_IMPORT_PREFIX } from '../../../dist/content/consts.js';
import { image, resolveImageField } from '../../../dist/content/image.js';
import { getEntryData } from '../../../dist/content/utils.js';
import { createTempDir } from './test-helpers.ts';

const coverFixture = fileURLToPath(new URL('../assets/600x400.jpg', import.meta.url));

describe('image() source resolution', () => {
	let dir: string;
	let entryFilePath: string;
	let coverPath: string;

	before(async () => {
		dir = fileURLToPath(createTempDir('astro-image-resolution-'));
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
				unvalidatedData: { cover: image('cover.jpg'), ordinary: { __astro_image_field__: true } },
				_internal: { rawData: undefined, filePath: entryFilePath },
			},
			{ type: 'content_layer', loader: { name: 'test', load: () => {} } },
			false,
		);
		assert.equal(result.cover.width, 600);
		assert.equal(result.cover.height, 400);
		assert.deepEqual(result.ordinary, { __astro_image_field__: true });
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

	it('preserves a file read error other than a missing image', async (t) => {
		const error = Object.assign(new Error('Permission denied'), { code: 'EACCES' });
		t.mock.method(fs, 'readFile', async () => {
			throw error;
		});
		await assert.rejects(
			resolveImageField(image('./cover.jpg'), entryFilePath),
			(cause) => cause === error,
		);
	});

	it('passes a remote URL through without reading it', async () => {
		for (const src of ['https://example.com/cover.jpg', '//cdn.example/cover.jpg']) {
			const result = await resolveImageField(image(src), entryFilePath, async () => {
				assert.fail('Remote images must not use the local resolver');
			});
			assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}${src}`);
			assert.equal(result.width, undefined);
		}
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
