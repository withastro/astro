import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGE_IMPORT_PREFIX } from '../../../dist/content/consts.js';
import { image, runWithContentImageContext } from '../../../dist/content/image.js';
import { attachContentImageResolver } from '../../../dist/content/image-context.js';

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
		const result = await runWithContentImageContext({ filePath: entryFilePath }, () =>
			image('cover.jpg'),
		);
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}./cover.jpg`);
		assert.equal(result.width, 600);
		assert.equal(result.height, 400);
	});

	it('reads the active entry context when called without an explicit context', async () => {
		const result = await runWithContentImageContext({ filePath: entryFilePath }, () =>
			image('cover.jpg'),
		);
		assert.equal(result.width, 600);
		assert.equal(result.height, 400);
	});

	it('keeps an explicit relative source unchanged', async () => {
		const result = await runWithContentImageContext({ filePath: entryFilePath }, () =>
			image('./cover.jpg'),
		);
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}./cover.jpg`);
		assert.equal(result.width, 600);
	});

	it('reports a missing relative source', async () => {
		await assert.rejects(
			() => runWithContentImageContext({ filePath: entryFilePath }, () => image('./missing.jpg')),
			/Could not find requested image/,
		);
	});

	it('passes a remote URL through without reading it', async () => {
		const context = attachContentImageResolver({ filePath: entryFilePath }, async () => {
			throw new Error('the resolver must not run for a remote source');
		});
		const result = await runWithContentImageContext(context, () =>
			image('https://example.com/cover.jpg'),
		);
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}https://example.com/cover.jpg`);
		assert.equal(result.width, undefined);
	});

	it('resolves a root-absolute source through the resolver', async () => {
		const context = attachContentImageResolver({ filePath: entryFilePath }, async (source) =>
			source === '/cover.jpg' ? coverPath : undefined,
		);
		const result = await runWithContentImageContext(context, () => image('/cover.jpg'));
		assert.equal(result.width, 600);
	});

	it('defers an unresolved source to read time when no resolver is installed', async () => {
		const result = await runWithContentImageContext({ filePath: entryFilePath }, () =>
			image('not-a-file'),
		);
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}not-a-file`);
		assert.equal(result.width, undefined);
	});

	it('reads resolver context created by a separate module instance', async () => {
		const { attachContentImageResolver: attachFromDuplicate } = (await import(
			new URL('../../../dist/content/image-context.js?duplicate', import.meta.url).href
		)) as typeof import('../../../dist/content/image-context.js');
		const context = attachFromDuplicate({ filePath: entryFilePath }, async (source) =>
			source === '@images/cover.jpg' ? coverPath : undefined,
		);
		const result = await runWithContentImageContext(context, () => image('@images/cover.jpg'));

		assert.equal(result.width, 600);
	});

	it('reports an alias the resolver cannot resolve', async () => {
		const context = attachContentImageResolver({ filePath: entryFilePath }, async () => undefined);
		await assert.rejects(
			() => runWithContentImageContext(context, () => image('@missing/x.jpg')),
			/Could not find requested image/,
		);
	});

	it('defers to read time when the context has no file path', async () => {
		const result = await runWithContentImageContext({}, () => image('./cover.jpg'));
		assert.equal(result.src, `${IMAGE_IMPORT_PREFIX}./cover.jpg`);
		assert.equal(result.width, undefined);
	});

	it('rejects a call without the schema context', async () => {
		await assert.rejects(() => image('./cover.jpg'), /needs an active content entry context/);
	});
});
