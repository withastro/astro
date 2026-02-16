import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRenderQueue } from '../../../dist/runtime/server/render/queue/builder.js';
import { renderQueue } from '../../../dist/runtime/server/render/queue/renderer.js';
import { NodePool } from '../../../dist/runtime/server/render/queue/pool.js';

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
		};
	}

	// Create a NodePool for testing
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
			assert.equal(queue.nodes[0].content, 'Hello, World!');
		});

		it('should handle numbers', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(42, result, pool);

			assert.ok(queue.nodes.length > 0);
			assert.equal(queue.nodes[0].type, 'text');
			assert.equal(queue.nodes[0].content, '42');
		});

		it('should handle booleans', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(true, result, pool);

			assert.ok(queue.nodes.length > 0);
			assert.equal(queue.nodes[0].type, 'text');
			assert.equal(queue.nodes[0].content, 'true');
		});

		it('should handle arrays', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(['Hello', ' ', 'World'], result, pool);

			assert.equal(queue.nodes.length, 3);
			assert.equal(queue.nodes[0].content, 'Hello');
			assert.equal(queue.nodes[1].content, ' ');
			assert.equal(queue.nodes[2].content, 'World');
		});

		it('should handle null and undefined (skip them)', async () => {
			const result = createMockResult();
			const nullQueue = await buildRenderQueue(null, result);
			const undefinedQueue = await buildRenderQueue(undefined, result);

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
			assert.equal(zeroQueue.nodes[0].content, '0');
		});

		it('should handle promises', async () => {
			const result = createMockResult();
			const promise = Promise.resolve('Resolved value');
			const pool = createMockPool();
			const queue = await buildRenderQueue(promise, result, pool);

			assert.equal(queue.nodes.length, 1);
			assert.equal(queue.nodes[0].content, 'Resolved value');
		});

		it('should handle nested arrays', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue([['Nested', ' '], 'Array'], result, pool);

			assert.equal(queue.nodes.length, 3);
			assert.equal(queue.nodes[0].content, 'Nested');
			assert.equal(queue.nodes[1].content, ' ');
			assert.equal(queue.nodes[2].content, 'Array');
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
			assert.equal(queue.nodes[0].content, 'First');
			assert.equal(queue.nodes[1].content, 'Second');
			assert.equal(queue.nodes[2].content, 'Third');
		});

		it('should track parent relationships', async () => {
			const result = createMockResult();
			const nestedArray = [['child1', 'child2'], 'sibling'];
			const pool = createMockPool();
			const queue = await buildRenderQueue(nestedArray, result, pool);

			// Verify correct node structure
			assert.equal(queue.nodes.length, 3);
			assert.equal(queue.nodes[0].content, 'child1');
			assert.equal(queue.nodes[1].content, 'child2');
			assert.equal(queue.nodes[2].content, 'sibling');
		});

		it('should maintain correct rendering order', async () => {
			const result = createMockResult();
			const pool = createMockPool();
			const queue = await buildRenderQueue(['A', 'B', 'C'], result, pool);

			assert.equal(queue.nodes[0].content, 'A');
			assert.equal(queue.nodes[1].content, 'B');
			assert.equal(queue.nodes[2].content, 'C');
		});

		it('should handle sync iterables (Set)', async () => {
			const result = createMockResult();
			const set = new Set(['One', 'Two', 'Three']);
			const pool = createMockPool();
			const queue = await buildRenderQueue(set, result, pool);

			assert.equal(queue.nodes.length, 3);
			// Set iteration order is insertion order
			const contents = queue.nodes.map((n) => n.content);
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
			const queue = await buildRenderQueue(['Hello', ' ', 'World'], result, pool);

			let output = '';
			const destination = {
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
			const queue = await buildRenderQueue('<script>alert("XSS")</script>', result, pool);

			let output = '';
			const destination = {
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
			const queue = await buildRenderQueue(null, result, pool);

			let output = '';
			const destination = {
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
			const queue = await buildRenderQueue([1, 2, 3], result, pool);

			let output = '';
			const destination = {
				write(chunk) {
					output += String(chunk);
				},
			};

			await renderQueue(queue, destination);
			assert.equal(output, '123');
		});
	});
});
