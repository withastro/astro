import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRenderQueue } from '../../../dist/runtime/server/render/queue/builder.js';
import { renderQueue } from '../../../dist/runtime/server/render/queue/renderer.js';
import { NodePool } from '../../../dist/runtime/server/render/queue/pool.js';
import { markHTMLString } from '../../../dist/runtime/server/index.js';

// Mock SSRResult for testing
function createMockResult() {
	return {
		_metadata: {
			hasHydrationScript: false,
			hasRenderedHead: false,
			hasDirectives: new Set(),
			headInTree: false,
			extraHead: [],
			propagators: new Set(),
		},
		styles: new Set(),
		scripts: new Set(),
		links: new Set(),
	};
}

// Create a NodePool for testing
function createMockPool() {
	return new NodePool(1000);
}

describe('Queue batching optimization', () => {
	it('should batch consecutive text nodes', async () => {
		const result = createMockResult();
		const pool = createMockPool();
		const items = ['Hello', ' ', 'world', '!'];

		const queue = await buildRenderQueue(items, result, pool);

		// All text nodes should be in the queue
		assert.equal(queue.nodes.length, 4);
		assert.equal(
			queue.nodes.every((n) => n.type === 'text'),
			true,
		);

		// When rendered, they should be batched into one write
		let writeCount = 0;
		let output = '';
		const destination = {
			write(chunk) {
				writeCount++;
				output += String(chunk);
			},
		};

		await renderQueue(queue, destination);

		assert.equal(output, 'Hello world!');
		assert.equal(writeCount, 1); // All 4 nodes batched into 1 write!
	});

	it('should batch consecutive html-string nodes', async () => {
		const result = createMockResult();
		const pool = createMockPool();

		const items = [markHTMLString('<div>'), markHTMLString('content'), markHTMLString('</div>')];

		const queue = await buildRenderQueue(items, result, pool);

		let writeCount = 0;
		let output = '';
		const destination = {
			write(chunk) {
				writeCount++;
				output += String(chunk);
			},
		};

		await renderQueue(queue, destination);

		// Should batch into single write
		assert.equal(writeCount, 1, 'Should batch consecutive html-string nodes');
		assert.equal(output, '<div>content</div>');
	});

	it('should NOT batch across component boundaries', async () => {
		const result = createMockResult();
		const pool = createMockPool();

		// Create a simple component
		const componentInstance = {
			render(dest) {
				dest.write('<p>Component</p>');
			},
		};

		const items = ['before', componentInstance, 'after'];

		const queue = await buildRenderQueue(items, result, pool);

		let writeCount = 0;
		let output = '';
		const destination = {
			write(chunk) {
				writeCount++;
				output += String(chunk);
			},
		};

		await renderQueue(queue, destination);

		// Should have 3 writes: batched 'before', component output, batched 'after'
		assert.equal(writeCount, 3, 'Should NOT batch across component boundaries');
		assert.equal(output, 'before<p>Component</p>after');
	});

	it('should demonstrate performance improvement with large arrays', async () => {
		const result = createMockResult();
		const pool = createMockPool();

		// Create a large array of text items (simulating a list)
		const items = Array.from({ length: 1000 }, (_, i) => `Item ${i + 1}`);

		const queue = await buildRenderQueue(items, result, pool);

		assert.equal(queue.nodes.length, 1000);

		let writeCount = 0;
		const destination = {
			write() {
				writeCount++;
			},
		};

		await renderQueue(queue, destination);

		// With batching: 1 write (all text nodes batched together)
		// Without batching: 1000 writes (one per node)
		assert.equal(writeCount, 1, 'Should batch 1000 text nodes into 1 write (99.9% reduction!)');
	});

	it('should batch mixed text and html-string nodes', async () => {
		const result = createMockResult();
		const pool = createMockPool();

		const items = [
			'Text 1',
			markHTMLString('<b>Bold</b>'),
			'Text 2',
			markHTMLString('<i>Italic</i>'),
		];

		const queue = await buildRenderQueue(items, result, pool);

		let writeCount = 0;
		let output = '';
		const destination = {
			write(chunk) {
				writeCount++;
				output += String(chunk);
			},
		};

		await renderQueue(queue, destination);

		// All should be batched since they're all batchable types
		assert.equal(writeCount, 1);
		assert.equal(output, 'Text 1<b>Bold</b>Text 2<i>Italic</i>');
	});
});
