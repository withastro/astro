import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shouldAppendForwardSlash } from '../../../dist/core/build/util.js';

describe('shouldAppendForwardSlash', () => {
	describe('with build.format = "directory"', () => {
		it('should append slash when trailingSlash is "always"', () => {
			assert.equal(shouldAppendForwardSlash('always', 'directory'), true);
		});

		it('should not append slash when trailingSlash is "never"', () => {
			assert.equal(shouldAppendForwardSlash('never', 'directory'), false);
		});

		it('should append slash when trailingSlash is "ignore"', () => {
			assert.equal(shouldAppendForwardSlash('ignore', 'directory'), true);
		});
	});

	describe('with build.format = "file"', () => {
		it('should append slash when trailingSlash is "always"', () => {
			assert.equal(shouldAppendForwardSlash('always', 'file'), true);
		});

		it('should not append slash when trailingSlash is "never"', () => {
			assert.equal(shouldAppendForwardSlash('never', 'file'), false);
		});

		it('should not append slash when trailingSlash is "ignore"', () => {
			assert.equal(shouldAppendForwardSlash('ignore', 'file'), false);
		});
	});

	describe('with build.format = "preserve"', () => {
		it('should append slash when trailingSlash is "always"', () => {
			assert.equal(shouldAppendForwardSlash('always', 'preserve'), true);
		});

		it('should not append slash when trailingSlash is "never"', () => {
			assert.equal(shouldAppendForwardSlash('never', 'preserve'), false);
		});

		it('should not append slash when trailingSlash is "ignore"', () => {
			assert.equal(shouldAppendForwardSlash('ignore', 'preserve'), false);
		});
	});
});