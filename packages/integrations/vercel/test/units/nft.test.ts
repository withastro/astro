import assert from 'node:assert/strict';
import { join, parse } from 'node:path';
import { describe, it } from 'node:test';
import { findCommonAncestor } from '../../dist/lib/nft.js';

describe('findCommonAncestor', () => {
	const volumeRoot = parse(process.cwd()).root;

	it('returns the root path when it contains the entry', () => {
		const root = join(volumeRoot, 'workspace', 'app');
		const entry = join(root, 'dist', 'entry.mjs');

		assert.equal(findCommonAncestor(root, entry), root);
	});

	it('returns a shared parent when the entry is outside the root', () => {
		const parent = join(volumeRoot, 'workspace');
		const root = join(parent, 'app');
		const entry = join(parent, 'dist', 'entry.mjs');

		assert.equal(findCommonAncestor(root, entry), parent);
	});

	it('stops at the filesystem root', () => {
		const root = join(volumeRoot, 'app');
		const entry = join(volumeRoot, 'dist', 'entry.mjs');

		assert.equal(findCommonAncestor(root, entry), volumeRoot);
	});
});
