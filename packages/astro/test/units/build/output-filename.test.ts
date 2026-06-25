import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getOutputFilename } from '../../../dist/core/output-filename.js';
import type { RouteData } from '../../../dist/types/public/internal.js';

function route(overrides: Partial<RouteData>): RouteData {
	return overrides as RouteData;
}

describe('getOutputFilename', () => {
	it('returns the route name for endpoints', () => {
		assert.equal(getOutputFilename('directory', '/api/data.json', route({ type: 'endpoint' })), '/api/data.json');
	});

	it('returns index.html for the root page', () => {
		assert.equal(getOutputFilename('directory', '/', route({ type: 'page' })), '/index.html');
		assert.equal(getOutputFilename('directory', '', route({ type: 'page' })), 'index.html');
	});

	it('uses html files when build format is file', () => {
		assert.equal(getOutputFilename('file', '/blog/post', route({ type: 'page' })), '/blog/post.html');
	});

	it('uses html files for status code pages', () => {
		assert.equal(getOutputFilename('directory', '/404', route({ type: 'page' })), '/404.html');
		assert.equal(getOutputFilename('directory', '/500', route({ type: 'page' })), '/500.html');
	});

	it('uses html files for non-index routes when build format is preserve', () => {
		assert.equal(
			getOutputFilename('preserve', '/blog/post', route({ type: 'page', isIndex: false })),
			'/blog/post.html',
		);
	});

	it('uses index.html for directory and index preserve routes', () => {
		assert.equal(
			getOutputFilename('directory', '/blog/post', route({ type: 'page', isIndex: false })),
			'/blog/post/index.html',
		);
		assert.equal(
			getOutputFilename('preserve', '/blog', route({ type: 'page', isIndex: true })),
			'/blog/index.html',
		);
	});
});
