import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { shouldAddCharset } from '../dist/mdx/charset.js';

// A hardcoded `file:///project/src/` has no drive letter, which Windows rejects.
const SRC_DIR_PATH = path.resolve('project', 'src');
const SRC_DIR = pathToFileURL(SRC_DIR_PATH + path.sep);

function addsCharset(relativePath: string) {
	const filePath = path.join(SRC_DIR_PATH, ...relativePath.split('/'));
	return shouldAddCharset('# Hello', filePath, SRC_DIR);
}

describe('satteri automatic charset', () => {
	it('adds charset to MDX pages', () => {
		assert.equal(addsCharset('pages/post.mdx'), true);
	});

	it('skips directories that only share the pages prefix', () => {
		assert.equal(addsCharset('pages-old/post.mdx'), false);
		assert.equal(addsCharset('pages2/post.mdx'), false);
	});
});
