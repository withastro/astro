import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRenderQueue } from '../../../dist/runtime/server/render/queue/builder.js';
import { renderQueue } from '../../../dist/runtime/server/render/queue/renderer.js';
import { NodePool } from '../../../dist/runtime/server/render/queue/pool.js';
import { renderPage } from '../../../dist/runtime/server/render/page.js';
import type { RenderDestination } from '../../../dist/runtime/server/render/common.js';
import type { QueueNode, TextNode } from '../../../dist/runtime/server/render/queue/types.js';

/** Type-safe accessor for text node content */
function textContent(node: QueueNode): string {
	assert.equal(node.type, 'text');
	return (node as TextNode).content;
}

/**
 * Tests for the queue-based rendering engine
 * These are unit tests for the core queue building and rendering logic
 */
describe('Queue-based rendering engine', () => {
	// Create a minimal SSRResult mock for testing
	function createMockResult() {
		return {
			_metadata: {
				hasHydrationScript: false,
				rendererSpecificHydrationScripts: new Set(),
				hasRenderedHead: false,
				renderedScripts: new Set(),
				hasDirectives: new Set(),
				hasRenderedServerIslandRuntime: false,
				headInTree: false,
				extraHead: [] as string[],
				extraStyleHashes: [] as string[],
				extraScriptHashes: [] as string[],
				propagators: new Set(),
			},
			styles: new Set(),
			scripts: new Set(),
			links: new Set(),
			componentMetadata: new Map(),
			cancelled: false,
			compressHTML: false,
		};
	}

	// Create a NodePool for testing
	function createMockPool(): NodePool {
		return new NodePool(1000);
	}

	describe('buildRenderQueue()', () => {
		it('should handle simple text nodes', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue('Hello, World!', result as any, pool);

			assert.ok(queue.nodes.length > 0);
			assert.equal(queue.nodes[0].type, 'text');
			assert.equal(textContent(queue.nodes[0]), 'Hello, World!');
		});

		it('should handle numbers', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(42, result as any, pool);

			assert.ok(queue.nodes.length > 0);
			assert.equal(queue.nodes[0].type, 'text');
			assert.equal(textContent(queue.nodes[0]), '42');
		});

		it('should handle booleans', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(true, result as any, pool);

			assert.ok(queue.nodes.length > 0);
			assert.equal(queue.nodes[0].type, 'text');
			assert.equal(textContent(queue.nodes[0]), 'true');
		});

		it('should handle arrays', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(['Hello', ' ', 'World'], result as any, pool);

			assert.equal(queue.nodes.length, 3);
			assert.equal(textContent(queue.nodes[0]), 'Hello');
			assert.equal(textContent(queue.nodes[1]), ' ');
			assert.equal(textContent(queue.nodes[2]), 'World');
		});

		it('should handle null and undefined (skip them)', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const nullQueue = await buildRenderQueue(null, result as any, pool);
			const undefinedQueue = await buildRenderQueue(undefined, result as any, pool);

			assert.equal(nullQueue.nodes.length, 0);
			assert.equal(undefinedQueue.nodes.length, 0);
		});

		it('should skip false but render 0', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const falseQueue = await buildRenderQueue(false, result as any, pool);
			const zeroQueue = await buildRenderQueue(0, result as any, pool);

			assert.equal(falseQueue.nodes.length, 0);
			assert.equal(zeroQueue.nodes.length, 1);
			assert.equal(textContent(zeroQueue.nodes[0]), '0');
		});

		it('should handle promises', async () => {
			const result = createMockResult();
			const promise = Promise.resolve('Resolved value');
			const pool = createMockPool();
			const queue = await buildRenderQueue(promise, result as any, pool);

			assert.equal(queue.nodes.length, 1);
			assert.equal(textContent(queue.nodes[0]), 'Resolved value');
		});

		it('should handle nested arrays', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue([['Nested', ' '], 'Array'], result as any, pool);

			assert.equal(queue.nodes.length, 3);
			assert.equal(textContent(queue.nodes[0]), 'Nested');
			assert.equal(textContent(queue.nodes[1]), ' ');
			assert.equal(textContent(queue.nodes[2]), 'Array');
		});

		it('should handle async iterables', async () => {
			const result = createMockResult();

			async function* asyncGen() {
				yield 'First';
				yield 'Second';
				yield 'Third';
			}

			const pool = createMockPool();
			const queue = await buildRenderQueue(asyncGen(), result as any, pool);

			assert.equal(queue.nodes.length, 3);
			assert.equal(textContent(queue.nodes[0]), 'First');
			assert.equal(textContent(queue.nodes[1]), 'Second');
			assert.equal(textContent(queue.nodes[2]), 'Third');
		});

		it('should track parent relationships', async () => {
			const result = createMockResult();
			const nestedArray = [['child1', 'child2'], 'sibling'];
			const pool = createMockPool();
			const queue = await buildRenderQueue(nestedArray, result as any, pool);

			// Verify correct node structure
			assert.equal(queue.nodes.length, 3);
			assert.equal(textContent(queue.nodes[0]), 'child1');
			assert.equal(textContent(queue.nodes[1]), 'child2');
			assert.equal(textContent(queue.nodes[2]), 'sibling');
		});

		it('should maintain correct rendering order', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(['A', 'B', 'C'], result as any, pool);

			assert.equal(textContent(queue.nodes[0]), 'A');
			assert.equal(textContent(queue.nodes[1]), 'B');
			assert.equal(textContent(queue.nodes[2]), 'C');
		});

		it('should handle sync iterables (Set)', async () => {
			const result = createMockResult();
			const set = new Set(['One', 'Two', 'Three']);
			const pool = createMockPool();
			const queue = await buildRenderQueue(set, result as any, pool);

			assert.equal(queue.nodes.length, 3);
			// Set iteration order is insertion order
			const contents = queue.nodes.map((n) => textContent(n));
			assert.ok(contents.includes('One'));
			assert.ok(contents.includes('Two'));
			assert.ok(contents.includes('Three'));
		});
	});

	describe('renderQueue()', () => {
		it('should render simple text to string', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue('Test content', result as any, pool);

			let output = '';
			const destination: RenderDestination = {
				write(chunk) {
					output += String(chunk);
				},
			};

			await renderQueue(queue, destination);
			assert.ok(output.includes('Test content'));
		});

		it('should render array to concatenated string', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(['Hello', ' ', 'World'], result as any, pool);

			let output = '';
			const destination: RenderDestination = {
				write(chunk) {
					output += String(chunk);
				},
			};

			await renderQueue(queue, destination);
			assert.equal(output, 'Hello World');
		});

		it('should escape HTML in text nodes', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue('<script>alert("XSS")</script>', result as any, pool);

			let output = '';
			const destination: RenderDestination = {
				write(chunk) {
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
			const queue = await buildRenderQueue(null, result as any, pool);

			let output = '';
			const destination: RenderDestination = {
				write(chunk) {
					output += String(chunk);
				},
			};

			await renderQueue(queue, destination);
			assert.equal(output, '');
		});

		it('should render numbers correctly', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue([1, 2, 3], result as any, pool);

			let output = '';
			const destination: RenderDestination = {
				write(chunk) {
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
	function createMockResultWithQueue() {
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
				extraHead: [] as string[],
				extraStyleHashes: [] as string[],
				extraScriptHashes: [] as string[],
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
		};
	}

	it('does not escape HTML tags when rendering a .html page component', async () => {
		// Simulate the component factory generated by vite-plugin-html for a .html file.
		// These return a plain string and have `astro:html = true`.
		const htmlPageFactory = function render(_props: Record<string, unknown>) {
			return '<body>\n  <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>\n</body>';
		};
		(htmlPageFactory as any)['astro:html'] = true;
		(htmlPageFactory as any).moduleId = 'src/pages/admin/index.html';

		const result = createMockResultWithQueue();

		const response = await renderPage(result as any, htmlPageFactory as any, {}, null, false);
		const html = await response.text();

		// The raw <script> tag must appear verbatim — not HTML-escaped
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
		const regularFactory = function render(_props: Record<string, unknown>) {
			return '<script>alert("xss")</script>';
		};
		// No astro:html flag set — this is the default for non-.html components
		(regularFactory as any).moduleId = 'src/pages/regular.astro';

		const result = createMockResultWithQueue();

		const response = await renderPage(result as any, regularFactory as any, {}, null, false);
		const html = await response.text();

		assert.ok(!html.includes('<script>alert'), `Expected escaped output, got:\n${html}`);
		assert.ok(html.includes('&lt;script&gt;'), `Expected HTML-escaped output, got:\n${html}`);
	});
});
