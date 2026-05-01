import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { VFile } from 'vfile';
import { createMarkdownProcessor, type RemarkPlugin } from '../dist/index.js';

describe('plugins', () => {
	it('should be able to get file path when passing fileURL', async () => {
		let context: VFile | undefined;

		const collectFile: RemarkPlugin = () => (_tree, file) => {
			context = file;
		};

		const processor = await createMarkdownProcessor({
			remarkPlugins: [collectFile],
		});

		await processor.render(`test`, {
			fileURL: new URL('virtual.md', import.meta.url),
		});

		assert.ok(context);
		assert.equal(context.path, fileURLToPath(new URL('virtual.md', import.meta.url)));
	});
});
