import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderJSX } from '../../../dist/runtime/server/jsx.js';
import { getDefaultClientDirectives } from '../../../dist/core/client-directive/index.js';
import type { SSRResult } from '../../../dist/types/public/internal.js';

/**
 * Creates a minimal AstroVNode matching the shape used by the JSX runtime.
 */
function createVNode(type: string, props: Record<string, any> = {}) {
	return {
		type,
		props,
		['astro:jsx']: true,
	};
}

/**
 * Creates a minimal SSRResult with the properties needed by renderJSX
 * and renderComponentToString/renderFrameworkComponent.
 */
function createMockResult(renderers: any[] = []): SSRResult {
	return {
		pathname: '/test',
		renderers,
		clientDirectives: getDefaultClientDirectives(),
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
}

describe('renderJSX custom elements', () => {
	it('routes standard HTML elements through renderElement', async () => {
		const result = createMockResult();
		const vnode = createVNode('div', { class: 'test', children: 'Hello' });
		const output = String(await renderJSX(result, vnode));
		assert.ok(output.includes('<div'), 'should contain opening tag');
		assert.ok(output.includes('class="test"'), 'should contain attributes');
		assert.ok(output.includes('Hello'), 'should contain children');
		assert.ok(output.includes('</div>'), 'should contain closing tag');
	});

	it('routes custom elements (with hyphens) through renderComponentToString for renderer pipeline', async () => {
		let rendererCheckCalled = false;
		let rendererRenderCalled = false;

		const mockRenderer = {
			name: 'test-renderer',
			ssr: {
				check: async (Component: unknown) => {
					rendererCheckCalled = true;
					return typeof Component === 'string' && Component.includes('-');
				},
				renderToStaticMarkup: async (Component: unknown, props: Record<string, any>) => {
					rendererRenderCalled = true;
					const attrs = Object.entries(props || {})
						.map(([k, v]) => ` ${k}="${v}"`)
						.join('');
					return {
						html: `<${Component}${attrs} data-ssr="true"></${Component}>`,
					};
				},
				supportsAstroStaticSlot: false,
			},
		};

		const result = createMockResult([mockRenderer]);
		const vnode = createVNode('my-element', { greeting: 'hello' });
		const output = String(await renderJSX(result, vnode));

		assert.ok(rendererCheckCalled, 'renderer check() should have been called for custom element');
		assert.ok(rendererRenderCalled, 'renderer renderToStaticMarkup() should have been called');
		assert.ok(output.includes('data-ssr="true"'), 'output should contain SSR marker from renderer');
		assert.ok(output.includes('my-element'), 'output should contain the custom element tag');
	});

	it('falls back to raw HTML for custom elements when no renderer claims them', async () => {
		const mockRenderer = {
			name: 'test-renderer',
			ssr: {
				check: async () => false, // Never claims any component
				renderToStaticMarkup: async () => ({ html: '' }),
				supportsAstroStaticSlot: false,
			},
		};

		const result = createMockResult([mockRenderer]);
		const vnode = createVNode('unknown-element', { foo: 'bar', children: 'content' });
		const output = String(await renderJSX(result, vnode));

		assert.ok(output.includes('<unknown-element'), 'should render the custom element tag');
		assert.ok(output.includes('foo="bar"'), 'should include attributes');
		assert.ok(output.includes('content'), 'should include children');
		assert.ok(output.includes('</unknown-element>'), 'should have closing tag');
	});

	it('preserves slot attribute on children of custom elements', async () => {
		const result = createMockResult();
		const childVNode = createVNode('svg', { slot: 'icon', xmlns: 'http://www.w3.org/2000/svg' });
		const vnode = createVNode('my-element', { children: [childVNode, 'text content'] });
		const output = String(await renderJSX(result, vnode));

		assert.ok(output.includes('slot="icon"'), 'should preserve slot attribute on child element');
		assert.ok(output.includes('<svg'), 'should render the child svg element');
		assert.ok(output.includes('<my-element'), 'should render the custom element');
		assert.ok(output.includes('text content'), 'should render text children');
	});

	it('does not route standard elements through the renderer pipeline', async () => {
		let rendererCheckCalled = false;

		const mockRenderer = {
			name: 'test-renderer',
			ssr: {
				check: async () => {
					rendererCheckCalled = true;
					return false;
				},
				renderToStaticMarkup: async () => ({ html: '' }),
				supportsAstroStaticSlot: false,
			},
		};

		const result = createMockResult([mockRenderer]);
		const vnode = createVNode('div', { class: 'test', children: 'Hello' });
		await renderJSX(result, vnode);

		assert.ok(
			!rendererCheckCalled,
			'renderer check() should NOT be called for standard HTML elements',
		);
	});
});
