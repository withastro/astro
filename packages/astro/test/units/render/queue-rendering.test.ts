import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRenderQueue } from '../../../dist/runtime/server/render/queue/builder.js';
import { renderQueue } from '../../../dist/runtime/server/render/queue/renderer.js';
import { NodePool } from '../../../dist/runtime/server/render/queue/pool.js';
import { renderPage } from '../../../dist/runtime/server/render/page.js';

type QueueSSRResult = Parameters<typeof buildRenderQueue>[1];
type RenderQueueNode = Awaited<ReturnType<typeof buildRenderQueue>>['nodes'][number];
type RenderPageResult = Parameters<typeof renderPage>[0];
type RenderPageComponent = Parameters<typeof renderPage>[1];
type TestPageFactory = RenderPageComponent & {
	(props: unknown): string;
	'astro:html'?: boolean;
	moduleId: string;
};

/**
 * Tests for the queue-based rendering engine
 * These are unit tests for the core queue building and rendering logic
 */
describe('Queue-based rendering engine', () => {
	function createMockResult(): QueueSSRResult {
		return {
			_metadata: {
				hasHydrationScript: false,
				rendererSpecificHydrationScripts: new Set(),
				hasRenderedHead: false,
				renderedScripts: new Set(),
				hasDirectives: new Set(),
				hasRenderedServerIslandRuntime: false,
				headInTree: false,
				extraHead: [],
				extraStyleHashes: [],
				extraScriptHashes: [],
				propagators: new Set(),
			},
			styles: new Set(),
			scripts: new Set(),
			links: new Set(),
			componentMetadata: new Map(),
			cancelled: false,
			compressHTML: false,
		} as unknown as QueueSSRResult;
	}

	function createMockPool() {
		return new NodePool(1000);
	}

	describe('buildRenderQueue()', () => {
		it('should handle simple text nodes', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue('Hello, World!', result, pool);

			assert.ok(queue.nodes.length > 0);
			assert.equal(queue.nodes[0].type, 'text');
			assert.equal(getTextContent(queue.nodes[0]), 'Hello, World!');
		});

		it('should handle numbers', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(42, result, pool);

			assert.ok(queue.nodes.length > 0);
			assert.equal(queue.nodes[0].type, 'text');
			assert.equal(getTextContent(queue.nodes[0]), '42');
		});

		it('should handle booleans', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(true, result, pool);

			assert.ok(queue.nodes.length > 0);
			assert.equal(queue.nodes[0].type, 'text');
			assert.equal(getTextContent(queue.nodes[0]), 'true');
		});

		it('should handle arrays', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(['Hello', ' ', 'World'], result, pool);

			assert.equal(queue.nodes.length, 3);
			assert.equal(getTextContent(queue.nodes[0]), 'Hello');
			assert.equal(getTextContent(queue.nodes[1]), ' ');
			assert.equal(getTextContent(queue.nodes[2]), 'World');
		});

		it('should handle null and undefined (skip them)', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const nullQueue = await buildRenderQueue(null, result, pool);
			const undefinedQueue = await buildRenderQueue(undefined, result, pool);

			assert.equal(nullQueue.nodes.length, 0);
			assert.equal(undefinedQueue.nodes.length, 0);
		});

		it('should skip false but render 0', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const falseQueue = await buildRenderQueue(false, result, pool);
			const zeroQueue = await buildRenderQueue(0, result, pool);

			assert.equal(falseQueue.nodes.length, 0);
			assert.equal(zeroQueue.nodes.length, 1);
			assert.equal(getTextContent(zeroQueue.nodes[0]), '0');
		});

		it('should handle promises', async () => {
			const result = createMockResult();
			const promise = Promise.resolve('Resolved value');
			const pool = createMockPool();
			const queue = await buildRenderQueue(promise, result, pool);

			assert.equal(queue.nodes.length, 1);
			assert.equal(getTextContent(queue.nodes[0]), 'Resolved value');
		});

		it('should handle nested arrays', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue([['Nested', ' '], 'Array'], result, pool);

			assert.equal(queue.nodes.length, 3);
			assert.equal(getTextContent(queue.nodes[0]), 'Nested');
			assert.equal(getTextContent(queue.nodes[1]), ' ');
			assert.equal(getTextContent(queue.nodes[2]), 'Array');
		});

		it('should handle async iterables', async () => {
			const result = createMockResult();

			async function* asyncGen() {
				yield 'First';
				yield 'Second';
				yield 'Third';
			}

			const pool = createMockPool();
			const queue = await buildRenderQueue(asyncGen(), result, pool);

			assert.equal(queue.nodes.length, 3);
			assert.equal(getTextContent(queue.nodes[0]), 'First');
			assert.equal(getTextContent(queue.nodes[1]), 'Second');
			assert.equal(getTextContent(queue.nodes[2]), 'Third');
		});

		it('should track parent relationships', async () => {
			const result = createMockResult();
			const nestedArray = [['child1', 'child2'], 'sibling'];
			const pool = createMockPool();
			const queue = await buildRenderQueue(nestedArray, result, pool);

			assert.equal(queue.nodes.length, 3);
			assert.equal(getTextContent(queue.nodes[0]), 'child1');
			assert.equal(getTextContent(queue.nodes[1]), 'child2');
			assert.equal(getTextContent(queue.nodes[2]), 'sibling');
		});

		it('should maintain correct rendering order', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(['A', 'B', 'C'], result, pool);

			assert.equal(getTextContent(queue.nodes[0]), 'A');
			assert.equal(getTextContent(queue.nodes[1]), 'B');
			assert.equal(getTextContent(queue.nodes[2]), 'C');
		});

		it('should handle sync iterables (Set)', async () => {
			const result = createMockResult();
			const set = new Set(['One', 'Two', 'Three']);
			const pool = createMockPool();
			const queue = await buildRenderQueue(set, result, pool);

			assert.equal(queue.nodes.length, 3);
			const contents = queue.nodes.map((node) => getTextContent(node));
			assert.ok(contents.includes('One'));
			assert.ok(contents.includes('Two'));
			assert.ok(contents.includes('Three'));
		});
	});

	describe('renderQueue()', () => {
		it('should render simple text to string', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue('Test content', result, pool);

			let output = '';
			const destination = {
				write(chunk: unknown) {
					output += String(chunk);
				},
			};

			await renderQueue(queue, destination);
			assert.ok(output.includes('Test content'));
		});

		it('should render array to concatenated string', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(['Hello', ' ', 'World'], result, pool);

			let output = '';
			const destination = {
				write(chunk: unknown) {
					output += String(chunk);
				},
			};

			await renderQueue(queue, destination);
			assert.equal(output, 'Hello World');
		});

		it('should escape HTML in text nodes', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue('<script>alert("XSS")</script>', result, pool);

			let output = '';
			const destination = {
				write(chunk: unknown) {
					output += String(chunk);
				},
			};

			await renderQueue(queue, destination);
			assert.ok(!output.includes('<script>'));
			assert.ok(output.includes('&lt;script&gt;'));
		});

		it('should handle empty queue', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(null, result, pool);

			let output = '';
			const destination = {
				write(chunk: unknown) {
					output += String(chunk);
				},
			};

			await renderQueue(queue, destination);
			assert.equal(output, '');
		});

		it('should render numbers correctly', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue([1, 2, 3], result, pool);

			let output = '';
			const destination = {
				write(chunk: unknown) {
					output += String(chunk);
				},
			};

			await renderQueue(queue, destination);
			assert.equal(output, '123');
		});
	});
});

/**
 * Regression tests for issue #16053:
 * queuedRendering breaks .html pages by escaping their raw HTML string output.
 */
describe('renderPage() with queuedRendering and .html pages', () => {
	function createMockResultWithQueue(): RenderPageResult {
		const pool = new NodePool(1000);
		return {
			_metadata: {
				hasHydrationScript: false,
				rendererSpecificHydrationScripts: new Set(),
				hasRenderedHead: false,
				renderedScripts: new Set(),
				hasDirectives: new Set(),
				hasRenderedServerIslandRuntime: false,
				headInTree: false,
				extraHead: [],
				extraStyleHashes: [],
				extraScriptHashes: [],
				propagators: new Set(),
			},
			styles: new Set(),
			scripts: new Set(),
			links: new Set(),
			componentMetadata: new Map(),
			cancelled: false,
			compressHTML: false,
			partial: false,
			response: { status: 200, statusText: 'OK', headers: new Headers() },
			shouldInjectCspMetaTags: false,
			_experimentalQueuedRendering: {
				enabled: true,
				pool,
			},
		} as unknown as RenderPageResult;
	}

	it('does not escape HTML tags when rendering a .html page component', async () => {
		// Simulate the component factory generated by vite-plugin-html for a .html file.
		// These return a plain string and have `astro:html = true`.
		const htmlPageFactory = function render(_props: unknown) {
			return '<body>\n  <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>\n</body>';
		} as TestPageFactory;
		htmlPageFactory['astro:html'] = true;
		htmlPageFactory.moduleId = 'src/pages/admin/index.html';

		const result = createMockResultWithQueue();
		const response = await renderPage(result, htmlPageFactory, {}, null, false);
		const html = await response.text();

		assert.ok(
			html.includes('<script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>'),
			`Expected unescaped <script> tag in output, got:\n${html}`,
		);
		assert.ok(
			!html.includes('&lt;script'),
			`Expected no HTML-escaped tags in output, got:\n${html}`,
		);
	});

	it('still escapes HTML in non-.html page components with queuedRendering', async () => {
		// A regular (non-.html) component factory should NOT have astro:html = true,
		// so raw string output from it should be treated as text and escaped.
		const regularFactory = function render(_props: unknown) {
			return '<script>alert("xss")</script>';
		} as TestPageFactory;
		regularFactory.moduleId = 'src/pages/regular.astro';

		const result = createMockResultWithQueue();
		const response = await renderPage(result, regularFactory, {}, null, false);
		const html = await response.text();

		assert.ok(!html.includes('<script>alert'), `Expected escaped output, got:\n${html}`);
		assert.ok(html.includes('&lt;script&gt;'), `Expected HTML-escaped output, got:\n${html}`);
	});
});

function getTextContent(node: RenderQueueNode): string {
	if (node.type !== 'text') {
		assert.fail(`expected text node, got ${node.type}`);
	}

	return node.content;
}
