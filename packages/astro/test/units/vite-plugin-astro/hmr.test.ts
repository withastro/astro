import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { handleHotUpdate, isStyleOnlyChanged } from '../../../dist/vite-plugin-astro/hmr.js';
import { defaultLogger } from '../test-utils.ts';

function createHmrTestContext({
	file,
	newCode,
	modules = [],
}: {
	file: string;
	newCode: string;
	modules?: { id: string }[];
}) {
	const ctx = {
		file,
		read: () => Promise.resolve(newCode),
		modules,
	};

	return ctx;
}

describe('handleHotUpdate', () => {
	it('deletes compile metadata when markup and style both change', async () => {
		const file = '/src/components/Target.astro';
		const oldCode = '<div>old</div>\n<style>.t { --gen: 0; }</style>';
		const newCode = '<div>new</div>\n<style>.t { --gen: 1; }</style>';

		const astroFileToCompileMetadata = new Map();
		astroFileToCompileMetadata.set(file, {
			originalCode: oldCode,
			css: [{ code: '.t { --gen: 0; }' }],
			scripts: [],
		});

		const ctx = createHmrTestContext({ file, newCode });

		const result = await handleHotUpdate(ctx as any, {
			logger: defaultLogger,
			compile: async () => ({}) as any,
			astroFileToCompileMetadata,
		});

		// Returns undefined so Vite uses its default full-module invalidation
		assert.equal(result, undefined);
		// The stale metadata entry must be deleted so the load hook recompiles from disk
		assert.equal(astroFileToCompileMetadata.has(file), false);
	});

	it('keeps metadata and eagerly recompiles when only style changes', async () => {
		const file = '/src/components/Target.astro';
		const oldCode = '<div>same</div>\n<style>.t { --gen: 0; }</style>';
		const newCode = '<div>same</div>\n<style>.t { --gen: 1; }</style>';

		const astroFileToCompileMetadata = new Map();
		astroFileToCompileMetadata.set(file, {
			originalCode: oldCode,
			css: [{ code: '.t { --gen: 0; }' }],
			scripts: [],
		});

		const styleModule = { id: file + '?astro&type=style&index=0&lang.css' };
		const ctx = createHmrTestContext({ file, newCode, modules: [styleModule] });
		const compile = async (code: string, filename: string) => {
			astroFileToCompileMetadata.set(filename, {
				originalCode: code,
				css: [{ code: '.t { --gen: 1; }' }],
				scripts: [],
			});
			return {};
		};

		const result = await handleHotUpdate(ctx as any, {
			logger: defaultLogger,
			compile: compile as any,
			astroFileToCompileMetadata,
		});

		// Returns the style modules for targeted CSS HMR
		assert.ok(Array.isArray(result));
		assert.equal(result.length, 1);
		assert.equal(result[0], styleModule);
		assert.deepEqual(astroFileToCompileMetadata.get(file), {
			originalCode: newCode,
			css: [{ code: '.t { --gen: 1; }' }],
			scripts: [],
		});
	});

	it('returns style modules for a style-only change when the file is its own CSS dependency', async () => {
		const file = '/src/components/Target.astro';
		const oldCode = '<div>same</div>\n<style>.t { --gen: 0; }</style>';
		const newCode = '<div>same</div>\n<style>.t { --gen: 1; }</style>';

		const astroFileToCompileMetadata = new Map();
		astroFileToCompileMetadata.set(file, {
			originalCode: oldCode,
			css: [{ code: '.t { --gen: 0; }', dependencies: [file] }],
			scripts: [],
		});

		const styleModule = { id: file + '?astro&type=style&index=0&lang.css' };
		const mainModule = { id: file };
		const ctx = createHmrTestContext({ file, newCode, modules: [mainModule, styleModule] });
		const compile = async (code: string, filename: string) => {
			astroFileToCompileMetadata.set(filename, {
				originalCode: code,
				css: [{ code: '.t { --gen: 1; }', dependencies: [file] }],
				scripts: [],
			});
			return {};
		};

		const result = await handleHotUpdate(ctx as any, {
			logger: defaultLogger,
			compile: compile as any,
			astroFileToCompileMetadata,
		});

		assert.deepEqual(result, [styleModule]);
		assert.equal(astroFileToCompileMetadata.get(file)?.originalCode, newCode);
	});

	it('deletes compile metadata of other Astro files that depend on the updated file', async () => {
		const file = '/src/styles/shared.css';
		const dependent = '/src/components/Dependent.astro';

		const astroFileToCompileMetadata = new Map();
		astroFileToCompileMetadata.set(dependent, {
			originalCode: '<style>@import "../styles/shared.css";</style>',
			css: [{ code: '', dependencies: [file] }],
			scripts: [],
		});

		const ctx = createHmrTestContext({ file, newCode: '.a { color: blue; }' });

		await handleHotUpdate(ctx as any, {
			logger: defaultLogger,
			compile: async () => ({}) as any,
			astroFileToCompileMetadata,
		});

		assert.equal(astroFileToCompileMetadata.has(dependent), false);
	});

	it('deletes compile metadata when only frontmatter changes', async () => {
		const file = '/src/components/Target.astro';
		const oldCode = '---\nconst x = 1;\n---\n<div>same</div>\n<style>.t { color: red; }</style>';
		const newCode = '---\nconst x = 2;\n---\n<div>same</div>\n<style>.t { color: red; }</style>';

		const astroFileToCompileMetadata = new Map();
		astroFileToCompileMetadata.set(file, {
			originalCode: oldCode,
			css: [{ code: '.t { color: red; }' }],
			scripts: [],
		});

		const ctx = createHmrTestContext({ file, newCode });

		await handleHotUpdate(ctx as any, {
			logger: defaultLogger,
			compile: async () => ({}) as any,
			astroFileToCompileMetadata,
		});

		assert.equal(astroFileToCompileMetadata.has(file), false);
	});
});

describe('isStyleOnlyChanged', () => {
	it('should return false if nothing change', () => {
		const oldCode = 'a';
		const newCode = 'a';
		assert.equal(isStyleOnlyChanged(oldCode, newCode), false);
	});

	it('should return false if script has changed', () => {
		const oldCode = '<script>console.log("Hello");</script><style>body { color: red; }</style>';
		const newCode = '<script>console.log("Hi");</script><style>body { color: red; }</style>';
		assert.equal(isStyleOnlyChanged(oldCode, newCode), false);
	});

	it('should return true if only style has changed', () => {
		const oldCode = '<style>body { color: red; }</style>';
		const newCode = '<style>body { color: blue; }</style>';
		assert.equal(isStyleOnlyChanged(oldCode, newCode), true);
	});

	it('should return false if style tags are added or removed', () => {
		const oldCode = '<style>body { color: red; }</style>';
		const newCode = '<style>body { color: red; }</style><style>a { color: blue; }</style>';
		assert.equal(isStyleOnlyChanged(oldCode, newCode), false);
	});

	it('should return false if frontmatter has changed', () => {
		const oldCode = `
---
title: Hello
---
<style>body { color: red; }</style>`;
		const newCode = `
---
title: Hi
---
<style>body { color: red; }</style>`;
		assert.equal(isStyleOnlyChanged(oldCode, newCode), false);
	});

	it('should return false if both frontmatter and style have changed', () => {
		const oldCode = `
---
title: Hello
---
<style>body { color: red; }</style>`;
		const newCode = `
---
title: Hi
---
<style>body { color: blue; }</style>`;
		assert.equal(isStyleOnlyChanged(oldCode, newCode), false);
	});

	it('should return false if both markup and style have changed', () => {
		const oldCode = '<h1>Hello</h1><style>body { color: red; }</style>';
		const newCode = '<h1>Hi</h1><style>body { color: blue; }</style>';
		assert.equal(isStyleOnlyChanged(oldCode, newCode), false);
	});
});
