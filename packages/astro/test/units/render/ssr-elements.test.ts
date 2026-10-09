import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	createAssetLink,
	createModuleScriptElement,
	createStylesheetElementSet,
} from '../../../dist/core/render/ssr-element.js';

describe('createAssetLink', () => {
	it('returns href unchanged when no base or prefix', () => {
		assert.equal(createAssetLink('/_astro/style.css'), '/_astro/style.css');
	});

	it('prepends base path', () => {
		assert.equal(createAssetLink('/_astro/style.css', '/docs/'), '/docs/_astro/style.css');
	});

	it('prepends string assetsPrefix', () => {
		assert.equal(
			createAssetLink('/_astro/style.css', '/', 'https://cdn.com'),
			'https://cdn.com/_astro/style.css',
		);
	});

	it('uses css-specific prefix from per-type object', () => {
		const prefix = { css: 'https://css.cdn.com', fallback: 'https://cdn.com' };
		assert.ok(createAssetLink('/_astro/style.css', '/', prefix).startsWith('https://css.cdn.com'));
	});

	it('falls back to fallback prefix for unknown extensions', () => {
		const prefix = { css: 'https://css.cdn.com', fallback: 'https://cdn.com' };
		assert.ok(createAssetLink('/_astro/image.png', '/', prefix).startsWith('https://cdn.com'));
	});

	it('uses js-specific prefix for .js files', () => {
		const prefix = { js: 'https://js.cdn.com', fallback: 'https://cdn.com' };
		assert.ok(createAssetLink('/_astro/app.js', '/', prefix).startsWith('https://js.cdn.com'));
	});

	it('appends query params', () => {
		const params = new URLSearchParams({ v: '123' });
		assert.equal(
			createAssetLink('/_astro/style.css', '/', undefined, params),
			'/_astro/style.css?v=123',
		);
	});

	it('preserves hash fragment and appends query params before it', () => {
		const params = new URLSearchParams({ v: '1' });
		const result = createAssetLink('/_astro/style.css#inline', '/', undefined, params);
		assert.ok(result.includes('?v=1'), 'query param should be present');
		assert.ok(result.endsWith('#inline'), 'hash should be at end');
		assert.ok(result.indexOf('?') < result.indexOf('#'), 'query before hash');
	});

	it('preserves hash fragment without query params', () => {
		const result = createAssetLink('/_astro/style.css#inline', '/');
		assert.ok(result.endsWith('#inline'));
	});
});

describe('createStylesheetElementSet', () => {
	it('creates an inline style element', () => {
		const set = createStylesheetElementSet([{ type: 'inline', content: 'body{color:red}' }]);
		const [el] = set;
		assert.equal(el.children, 'body{color:red}');
		assert.deepEqual(el.props, {});
	});

	it('creates an external link element with rel=stylesheet', () => {
		const set = createStylesheetElementSet([{ type: 'external', src: '/_astro/style.css' }]);
		const [el] = set;
		assert.equal(el.props.rel, 'stylesheet');
		assert.equal(el.children, '');
	});

	it('applies base path to external stylesheet href', () => {
		const set = createStylesheetElementSet(
			[{ type: 'external', src: '/_astro/style.css' }],
			'/docs/',
		);
		const [el] = set;
		assert.ok(el.props.href.startsWith('/docs/'), `expected /docs/ prefix, got ${el.props.href}`);
	});

	it('applies assetsPrefix to external stylesheet href — Migrated from astro-assets-prefix.test.js', () => {
		const set = createStylesheetElementSet(
			[{ type: 'external', src: '/_astro/style.css' }],
			'/',
			'https://cdn.com',
		);
		const [el] = set;
		assert.ok(
			el.props.href.startsWith('https://cdn.com'),
			`expected cdn prefix, got ${el.props.href}`,
		);
	});

	it('applies css-specific prefix — Migrated from astro-assets-prefix-multi-cdn.test.js', () => {
		const set = createStylesheetElementSet([{ type: 'external', src: '/_astro/style.css' }], '/', {
			css: 'https://css.cdn.com',
			fallback: 'https://cdn.com',
		});
		const [el] = set;
		assert.ok(
			el.props.href.startsWith('https://css.cdn.com'),
			`expected css cdn prefix, got ${el.props.href}`,
		);
	});

	it('handles mixed inline and external stylesheets', () => {
		const set = createStylesheetElementSet([
			{ type: 'inline', content: 'body{}' },
			{ type: 'external', src: '/_astro/style.css' },
		]);
		assert.equal(set.size, 2);
	});
});

describe('createModuleScriptElement', () => {
	it('creates an external module script with type=module and src', () => {
		const el = createModuleScriptElement({ type: 'external', value: '/_astro/app.js' });
		assert.equal(el.props.type, 'module');
		assert.equal(el.props.src, '/_astro/app.js');
		assert.equal(el.children, '');
	});

	it('creates an inline module script with type=module and children', () => {
		const el = createModuleScriptElement({ type: 'inline', value: 'console.log(1)' });
		assert.equal(el.props.type, 'module');
		assert.equal(el.children, 'console.log(1)');
		assert.equal(el.props.src, undefined);
	});

	it('applies string assetsPrefix to external script src — Migrated from astro-assets-prefix.test.js', () => {
		const el = createModuleScriptElement(
			{ type: 'external', value: '/_astro/app.js' },
			'/',
			'https://cdn.com',
		);
		assert.ok(
			el.props.src.startsWith('https://cdn.com'),
			`expected cdn prefix, got ${el.props.src}`,
		);
	});

	it('applies js-specific prefix to external script src — Migrated from astro-assets-prefix-multi-cdn.test.js', () => {
		const el = createModuleScriptElement({ type: 'external', value: '/_astro/app.js' }, '/', {
			js: 'https://js.cdn.com',
			fallback: 'https://cdn.com',
		});
		assert.ok(
			el.props.src.startsWith('https://js.cdn.com'),
			`expected js cdn prefix, got ${el.props.src}`,
		);
	});

	it('applies base path to external script src', () => {
		const el = createModuleScriptElement({ type: 'external', value: '/_astro/app.js' }, '/docs/');
		assert.ok(el.props.src.startsWith('/docs/'));
	});
});
