import { renderMarkdown } from '../dist/index.js';
import { mockRenderMarkdownParams } from './test-utils.js';
import chai from 'chai';

import { fileURLToPath } from 'node:url';

describe('plugins', () => {
	// https://github.com/withastro/astro/issues/3264
	it('should be able to get file path when passing fileURL', async () => {
		let context;
		await renderMarkdown(`test`, {
			...mockRenderMarkdownParams,
			fileURL: new URL('virtual.md', import.meta.url),
			remarkPlugins: [
				function () {
					const transformer = (tree, file) => {
						context = file;
					};

					return transformer;
				},
			],
		});

		chai.expect(typeof context).to.equal('object');
		chai.expect(context.path).to.equal(fileURLToPath(new URL('virtual.md', import.meta.url)));
	});
});
