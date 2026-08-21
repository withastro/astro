import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shouldAppendHtmlExtension } from '../../../dist/vite-plugin-app/handle-request.js';

const page = (isIndex: boolean) => ({ type: 'page' as const, isIndex });
const endpoint = (isIndex: boolean) => ({ type: 'endpoint' as const, isIndex });

describe('shouldAppendHtmlExtension', () => {
	// #region build.format: 'preserve'
	describe('build.format: "preserve"', () => {
		it('appends .html for non-index page', () => {
			assert.equal(shouldAppendHtmlExtension('/blog', 'preserve', page(false)), true);
		});

		it('does not append .html for index page', () => {
			assert.equal(shouldAppendHtmlExtension('/blog', 'preserve', page(true)), false);
		});

		it('does not append .html for root path', () => {
			assert.equal(shouldAppendHtmlExtension('/', 'preserve', page(false)), false);
		});

		it('does not append .html when pathname already has an extension', () => {
			assert.equal(shouldAppendHtmlExtension('/blog.html', 'preserve', page(false)), false);
		});

		it('does not append .html for endpoints', () => {
			assert.equal(shouldAppendHtmlExtension('/api/data', 'preserve', endpoint(false)), false);
		});
	});
	// #endregion

	// #region build.format: 'file'
	describe('build.format: "file"', () => {
		it('appends .html for non-index page', () => {
			assert.equal(shouldAppendHtmlExtension('/about', 'file', page(false)), true);
		});

		it('appends .html for index page', () => {
			assert.equal(shouldAppendHtmlExtension('/blog', 'file', page(true)), true);
		});

		it('does not append .html for root path', () => {
			assert.equal(shouldAppendHtmlExtension('/', 'file', page(true)), false);
		});

		it('does not append .html when pathname already has an extension', () => {
			assert.equal(shouldAppendHtmlExtension('/about.html', 'file', page(false)), false);
		});

		it('does not append .html for endpoints', () => {
			assert.equal(shouldAppendHtmlExtension('/api/data', 'file', endpoint(false)), false);
		});
	});
	// #endregion

	// #region build.format: 'directory'
	describe('build.format: "directory"', () => {
		it('does not append .html for pages', () => {
			assert.equal(shouldAppendHtmlExtension('/about', 'directory', page(false)), false);
		});

		it('does not append .html for index pages', () => {
			assert.equal(shouldAppendHtmlExtension('/blog', 'directory', page(true)), false);
		});
	});
	// #endregion
});
