import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/**
 * Tests the SSRElement → string extraction logic used by FetchState.getActionAPIContext().
 * The extraction reads `el.props.href` for stylesheet links, `el.children` for
 * inline styles, and `el.props.src` for external scripts.
 */

function extractAssets(headElements: {
	styles: Set<{ props: Record<string, any>; children: string }>;
	scripts: Set<{ props: Record<string, any>; children: string }>;
	links: Set<{ props: Record<string, any>; children: string }>;
} | undefined) {
	const styles: string[] = [];
	const links: string[] = [];
	const scripts: string[] = [];
	if (headElements) {
		for (const el of headElements.styles) {
			if (el.props.href) {
				links.push(el.props.href);
			} else if (el.children) {
				styles.push(el.children);
			}
		}
		for (const el of headElements.scripts) {
			if (el.props.src) {
				scripts.push(el.props.src);
			}
		}
	}
	return { styles, scripts, links };
}

describe('extractAssets from headElements', () => {
	it('returns empty arrays when headElements is undefined', () => {
		const result = extractAssets(undefined);
		assert.deepEqual(result, { styles: [], scripts: [], links: [] });
	});

	it('returns empty arrays when headElements has empty sets', () => {
		const result = extractAssets({ styles: new Set(), scripts: new Set(), links: new Set() });
		assert.deepEqual(result, { styles: [], scripts: [], links: [] });
	});

	it('extracts external stylesheet URLs into links', () => {
		const styles = new Set([
			{ props: { rel: 'stylesheet', href: '/_astro/index.abc12.css' }, children: '' },
			{ props: { rel: 'stylesheet', href: '/_astro/global.def34.css' }, children: '' },
		]);
		const result = extractAssets({ styles, scripts: new Set(), links: new Set() });
		assert.deepEqual(result.links, ['/_astro/index.abc12.css', '/_astro/global.def34.css']);
		assert.deepEqual(result.styles, []);
	});

	it('extracts inline CSS into styles', () => {
		const styles = new Set([
			{ props: {}, children: 'body { color: red }' },
			{ props: {}, children: '.header { font-size: 2rem }' },
		]);
		const result = extractAssets({ styles, scripts: new Set(), links: new Set() });
		assert.deepEqual(result.styles, ['body { color: red }', '.header { font-size: 2rem }']);
		assert.deepEqual(result.links, []);
	});

	it('splits mixed inline and external styles correctly', () => {
		const styles = new Set([
			{ props: {}, children: 'body { color: red }' },
			{ props: { rel: 'stylesheet', href: '/_astro/style.css' }, children: '' },
		]);
		const result = extractAssets({ styles, scripts: new Set(), links: new Set() });
		assert.deepEqual(result.styles, ['body { color: red }']);
		assert.deepEqual(result.links, ['/_astro/style.css']);
	});

	it('extracts external script URLs', () => {
		const scripts = new Set([
			{ props: { type: 'module', src: '/_astro/app.abc12.js' }, children: '' },
		]);
		const result = extractAssets({ styles: new Set(), scripts, links: new Set() });
		assert.deepEqual(result.scripts, ['/_astro/app.abc12.js']);
	});

	it('skips inline scripts', () => {
		const scripts = new Set([
			{ props: { type: 'module' }, children: 'console.log("hi")' },
			{ props: { type: 'module', src: '/_astro/app.js' }, children: '' },
		]);
		const result = extractAssets({ styles: new Set(), scripts, links: new Set() });
		assert.deepEqual(result.scripts, ['/_astro/app.js']);
	});

	it('handles multiple external scripts', () => {
		const scripts = new Set([
			{ props: { type: 'module', src: '/_astro/app.js' }, children: '' },
			{ props: { type: 'module', src: '/_astro/vendor.js' }, children: '' },
		]);
		const result = extractAssets({ styles: new Set(), scripts, links: new Set() });
		assert.deepEqual(result.scripts, ['/_astro/app.js', '/_astro/vendor.js']);
	});

	it('handles mixed styles and scripts together', () => {
		const styles = new Set([
			{ props: {}, children: 'body { color: red }' },
			{ props: { rel: 'stylesheet', href: '/_astro/home.css' }, children: '' },
		]);
		const scripts = new Set([
			{ props: { type: 'module', src: '/_astro/app.js' }, children: '' },
		]);
		const result = extractAssets({ styles, scripts, links: new Set() });
		assert.deepEqual(result.styles, ['body { color: red }']);
		assert.deepEqual(result.links, ['/_astro/home.css']);
		assert.deepEqual(result.scripts, ['/_astro/app.js']);
	});
});
