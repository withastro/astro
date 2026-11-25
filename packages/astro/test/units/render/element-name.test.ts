import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderJSX } from '../../../dist/runtime/server/jsx.js';
import { sanitizeElementName } from '../../../dist/runtime/server/render/util.js';
import type { SSRResult } from '../../../dist/types/public/internal.js';

describe('sanitizeElementName', () => {
	it('keeps valid element names unchanged', () => {
		for (const name of ['div', 'H1', 'my-element', 'svg', 'foreignObject', 'x-é', 'a.b_c:d']) {
			assert.equal(sanitizeElementName(name), name);
		}
	});

	it('trims surrounding whitespace', () => {
		assert.equal(sanitizeElementName('  div  '), 'div');
	});

	it('keeps only the leading valid element name', () => {
		assert.equal(sanitizeElementName('p style=color:red;'), 'p');
		assert.equal(sanitizeElementName('p><script>x</script>'), 'p');
		assert.equal(sanitizeElementName('svg/onload=alert(1)'), 'svg');
		assert.equal(sanitizeElementName('h1/class=x'), 'h1');
		assert.equal(sanitizeElementName('div=x'), 'div');
		assert.equal(sanitizeElementName('div\tid=x'), 'div');
	});

	it('throws for strings that do not start with a valid element name', () => {
		for (const name of ['', '   ', '!--', '1div', '/div', '-div']) {
			assert.throws(() => sanitizeElementName(name), /Invalid element name/, name);
		}
	});
});

describe('renderJSX element names', () => {
	const result = {
		pathname: '/test',
		renderers: [],
		compressHTML: false,
		partial: false,
		cancelled: false,
		_metadata: {
			propagators: new Set(),
			hasHydrationScript: false,
			hasDirectives: new Set(),
			hasRenderedHead: false,
			rendererSpecificHydrationScripts: new Set(),
		},
	} as unknown as SSRResult;

	it('renders only the valid element name for string element types', async () => {
		const vnode = {
			type: 'span/data-x=1',
			props: { id: 'target', children: 'hello' },
			['astro:jsx']: true,
		};
		const output = String(await renderJSX(result, vnode));
		assert.equal(output, '<span id="target">hello</span>');
	});
});
