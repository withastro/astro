import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import type * as hast from 'hast';
import type { VFile } from 'vfile';
import { rehypeApplyFrontmatterExport } from '../dist/mdx/rehype-apply-frontmatter-export.js';

// A hardcoded `file:///project/src/` has no drive letter, which Windows rejects.
const SRC_DIR_PATH = path.resolve('project', 'src');
const SRC_DIR = pathToFileURL(SRC_DIR_PATH + path.sep);

// `vfile.path` comes from Vite, which always uses forward slashes.
function getFilePath(relativePath: string) {
	return path
		.join(SRC_DIR_PATH, ...relativePath.split('/'))
		.split(path.sep)
		.join('/');
}

function addsCharset(relativePath: string) {
	const tree: hast.Root = { type: 'root', children: [] };
	const vfile = {
		path: getFilePath(relativePath),
		data: {
			astro: { frontmatter: {} },
			applyFrontmatterExport: { srcDir: SRC_DIR },
		},
	} as unknown as VFile;
	rehypeApplyFrontmatterExport()(tree, vfile);
	return tree.children.some((node) => node.type === 'mdxJsxFlowElement' && node.name === 'meta');
}

describe('rehypeApplyFrontmatterExport automatic charset', () => {
	it('adds charset to MDX pages', () => {
		assert.equal(addsCharset('pages/post.mdx'), true);
	});

	it('skips directories that only share the pages prefix', () => {
		assert.equal(addsCharset('pages-old/post.mdx'), false);
		assert.equal(addsCharset('pages2/post.mdx'), false);
	});
});
