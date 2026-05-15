import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isStyleModule } from '../../../dist/vite-plugin-hmr-reload/index.js';

describe('isStyleModule', () => {
	it('detects external .css files by file path', () => {
		const mod = { file: '/path/to/styles.css', id: '/path/to/styles.css' };
		assert.equal(isStyleModule(mod), true);
	});

	it('detects external .scss files by file path', () => {
		const mod = { file: '/path/to/styles.scss', id: '/path/to/styles.scss' };
		assert.equal(isStyleModule(mod), true);
	});

	it('detects external .sass files by file path', () => {
		const mod = { file: '/path/to/styles.sass', id: '/path/to/styles.sass' };
		assert.equal(isStyleModule(mod), true);
	});

	it('detects external .less files by file path', () => {
		const mod = { file: '/path/to/styles.less', id: '/path/to/styles.less' };
		assert.equal(isStyleModule(mod), true);
	});

	it('detects external .styl files by file path', () => {
		const mod = { file: '/path/to/styles.styl', id: '/path/to/styles.styl' };
		assert.equal(isStyleModule(mod), true);
	});

	it('detects external .pcss files by file path', () => {
		const mod = { file: '/path/to/styles.pcss', id: '/path/to/styles.pcss' };
		assert.equal(isStyleModule(mod), true);
	});

	it('detects CSS files with query params in id (e.g. ?used, ?direct)', () => {
		const mod = { file: '/path/to/styles.css', id: '/path/to/styles.css?used' };
		assert.equal(isStyleModule(mod), true);
	});

	it('detects CSS module files (e.g. .module.scss)', () => {
		const mod = { file: '/path/to/styles.module.scss', id: '/path/to/styles.module.scss' };
		assert.equal(isStyleModule(mod), true);
	});

	it('detects Astro inline style modules with lang.css', () => {
		const mod = {
			file: '/path/to/Component.astro',
			id: '/path/to/Component.astro?astro&type=style&index=0&lang.css',
		};
		assert.equal(isStyleModule(mod), true);
	});

	it('detects Astro inline style modules with lang.scss', () => {
		const mod = {
			file: '/path/to/Component.astro',
			id: '/path/to/Component.astro?astro&type=style&index=0&lang.scss',
		};
		assert.equal(isStyleModule(mod), true);
	});

	it('detects Astro inline style modules with multiple style indices', () => {
		const mod = {
			file: '/path/to/Component.astro',
			id: '/path/to/Component.astro?astro&type=style&index=2&lang.css',
		};
		assert.equal(isStyleModule(mod), true);
	});

	it('does not detect .astro files without style query params', () => {
		const mod = {
			file: '/path/to/Component.astro',
			id: '/path/to/Component.astro',
		};
		assert.equal(isStyleModule(mod), false);
	});

	it('does not detect Astro script modules', () => {
		const mod = {
			file: '/path/to/Component.astro',
			id: '/path/to/Component.astro?astro&type=script&index=0&lang.ts',
		};
		assert.equal(isStyleModule(mod), false);
	});

	it('does not detect JavaScript files', () => {
		const mod = { file: '/path/to/module.js', id: '/path/to/module.js' };
		assert.equal(isStyleModule(mod), false);
	});

	it('does not detect TypeScript files', () => {
		const mod = { file: '/path/to/module.ts', id: '/path/to/module.ts' };
		assert.equal(isStyleModule(mod), false);
	});

	it('handles modules with null file path', () => {
		const mod = { file: null, id: '/path/to/styles.css' };
		assert.equal(isStyleModule(mod), true);
	});

	it('handles modules with undefined id', () => {
		const mod = { file: '/path/to/styles.css', id: undefined };
		assert.equal(isStyleModule(mod), true);
	});
});
