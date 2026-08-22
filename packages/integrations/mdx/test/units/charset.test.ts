import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Root } from 'hast';
import type { VFile } from 'vfile';
import { rehypeApplyFrontmatterExport } from '../../dist/rehype-apply-frontmatter-export.js';
import { shouldAddCharset as shouldAddSatteriCharset } from '../../dist/satteri/charset.js';

const srcDir = pathToFileURL(path.join(process.cwd(), 'src') + path.sep);

function getFilePath(relativePath: string) {
	return fileURLToPath(new URL(relativePath, srcDir)).replace(/\\/g, '/');
}

function unifiedAddsCharset(relativePath: string) {
	const tree: Root = { type: 'root', children: [] };
	const vfile = {
		path: getFilePath(relativePath),
		data: {
			astro: { frontmatter: {} },
			applyFrontmatterExport: { srcDir },
		},
	} as unknown as VFile;
	rehypeApplyFrontmatterExport()(tree, vfile);
	return tree.children.some((node) => node.type === 'mdxJsxFlowElement' && node.name === 'meta');
}

function satteriAddsCharset(relativePath: string) {
	return shouldAddSatteriCharset('# Hello', getFilePath(relativePath), srcDir);
}

for (const [processor, addsCharset] of [
	['unified', unifiedAddsCharset],
	['Satteri', satteriAddsCharset],
] as const) {
	describe(`${processor} automatic charset`, () => {
		it('adds charset to MDX pages', () => {
			assert.equal(addsCharset('pages/post.mdx'), true);
		});

		it('skips directories that only share the pages prefix', () => {
			assert.equal(addsCharset('pages-old/post.mdx'), false);
			assert.equal(addsCharset('pages2/post.mdx'), false);
		});
	});
}
