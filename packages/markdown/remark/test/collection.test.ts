import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { VFile } from 'vfile';
import { createMarkdownProcessor, type RemarkPlugin, unified } from '../dist/index.js';

const collection = {
	name: 'docs',
	type: 'build-time',
	loader: { name: 'docs-loader' },
	descriptors: { library: 'docs' },
} as const;

describe('collection metadata', () => {
	function createSpy() {
		const files: VFile[] = [];
		const plugin: RemarkPlugin = () => (_tree, file) => {
			files.push(file);
		};
		return { files, plugin };
	}

	it('exposes the collection of a Markdown entry to plugins', async () => {
		const { files, plugin } = createSpy();
		const processor = await createMarkdownProcessor({ remarkPlugins: [plugin] });

		await processor.render('# Hello', { collection });

		assert.deepEqual(files[0].data.astro?.collection, collection);
	});

	it('leaves the collection unset for Markdown outside collections', async () => {
		const { files, plugin } = createSpy();
		const processor = await createMarkdownProcessor({ remarkPlugins: [plugin] });

		await processor.render('# Hello');

		assert.equal(files[0].data.astro?.collection, undefined);
	});

	it('exposes the collection of an MDX file to plugins', async () => {
		const { files, plugin } = createSpy();
		const renderer = await unified({ remarkPlugins: [plugin] }).createMdxRenderer!(
			{ syntaxHighlight: false, shikiConfig: {} },
			{ optimize: false },
		);

		await renderer.process('# Hello', '/project/src/docs/intro.mdx', {}, { collection });

		assert.deepEqual(files[0].data.astro?.collection, collection);
	});
});
