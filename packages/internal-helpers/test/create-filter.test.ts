import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createFilter } from '../dist/create-filter.js';

describe('createFilter', () => {
	describe('no patterns', () => {
		it('should return a function', () => {
			const filter = createFilter();
			assert.equal(typeof filter, 'function');
		});

		it('should pass all strings when no patterns given', () => {
			const filter = createFilter();
			assert.equal(filter('/src/foo.ts'), true);
			assert.equal(filter('bar.js'), true);
		});

		it('should reject non-string values', () => {
			const filter = createFilter();
			assert.equal(filter(42), false);
			assert.equal(filter(null), false);
			assert.equal(filter(undefined), false);
		});

		it('should reject strings with null bytes', () => {
			const filter = createFilter();
			assert.equal(filter('file\0.ts'), false);
		});
	});

	describe('include patterns', () => {
		it('should filter by glob string', () => {
			const filter = createFilter('**/*.tsx');
			assert.equal(filter('/src/components/Button.tsx'), true);
			assert.equal(filter('/src/utils/helper.ts'), false);
		});

		it('should filter by glob array', () => {
			const filter = createFilter(['**/*.tsx', '**/*.jsx']);
			assert.equal(filter('/src/Button.tsx'), true);
			assert.equal(filter('/src/Button.jsx'), true);
			assert.equal(filter('/src/helper.ts'), false);
		});

		it('should filter by RegExp', () => {
			const filter = createFilter(/\.tsx$/);
			assert.equal(filter('/src/Button.tsx'), true);
			assert.equal(filter('/src/helper.ts'), false);
		});

		it('should return false for non-matching paths when include is specified', () => {
			const filter = createFilter(['**/*.tsx']);
			assert.equal(filter('/src/app.ts'), false);
		});
	});

	describe('exclude patterns', () => {
		it('should exclude matching paths', () => {
			const filter = createFilter(null, ['**/node_modules/**']);
			assert.equal(filter('/src/app.ts'), true);
			assert.equal(filter('/node_modules/pkg/index.js'), false);
		});

		it('should prioritize exclude over include', () => {
			const filter = createFilter(['**/*.ts'], ['**/test/**']);
			assert.equal(filter('/src/app.ts'), true);
			assert.equal(filter('/test/app.ts'), false);
		});
	});

	describe('path normalization', () => {
		it('should normalize backslashes', () => {
			const filter = createFilter(['**/*.ts']);
			assert.equal(filter('src\\components\\App.ts'), true);
		});
	});

	describe('RegExp lastIndex handling', () => {
		it('should reset lastIndex on global RegExp', () => {
			const filter = createFilter(/\.tsx$/g);
			assert.equal(filter('/src/Button.tsx'), true);
			assert.equal(filter('/src/Other.tsx'), true);
			assert.equal(filter('/src/Another.tsx'), true);
		});
	});
});
