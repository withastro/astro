import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRenderQueue, renderQueue } from '../../../dist/runtime/server/render/queue/index.js';

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

describe('Queue batching optimization', () => {
	it('should batch consecutive text nodes', async () => {
		const result = createMockResult();
		const items = ['Hello', ' ', 'world', '!'];

		const queue = await buildRenderQueue(items, result);

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
		const { markHTMLString } = await import('../../../dist/runtime/server/escape.js');

		const items = [markHTMLString('<div>'), markHTMLString('content'), markHTMLString('</div>')];

		const queue = await buildRenderQueue(items, result);

		let writeCount = 0;
		let output = '';
		const destination = {
			write(chunk) {
				writeCount++;
				output += String(chunk);
			},
		};

		const { renderQueue } = await import('../../../dist/runtime/server/render/queue/index.js');
		await renderQueue(queue, destination);

		// Should batch into single write
		assert.equal(writeCount, 1, 'Should batch consecutive html-string nodes');
		assert.equal(output, '<div>content</div>');
	});

	it('should NOT batch across component boundaries', async () => {
		const result = createMockResult();

		// Create a simple component
		const componentInstance = {
			render(dest) {
				dest.write('<p>Component</p>');
			},
		};

		const items = ['before', componentInstance, 'after'];

		const queue = await buildRenderQueue(items, result);

		let writeCount = 0;
		let output = '';
		const destination = {
			write(chunk) {
				writeCount++;
				output += String(chunk);
			},
		};

		const { renderQueue } = await import('../../../dist/runtime/server/render/queue/index.js');
		await renderQueue(queue, destination);

		// Should have 3 writes: batched 'before', component output, batched 'after'
		assert.equal(writeCount, 3, 'Should NOT batch across component boundaries');
		assert.equal(output, 'before<p>Component</p>after');
	});

	it('should demonstrate performance improvement with large arrays', async () => {
		const result = createMockResult();

		// Create a large array of text items (simulating a list)
		const items = Array.from({ length: 1000 }, (_, i) => `Item ${i + 1}`);

		const queue = await buildRenderQueue(items, result);

		assert.equal(queue.nodes.length, 1000);

		let writeCount = 0;
		const destination = {
			write() {
				writeCount++;
			},
		};

		const { renderQueue } = await import('../../../dist/runtime/server/render/queue/index.js');
		await renderQueue(queue, destination);

		// With batching: 1 write (all text nodes batched together)
		// Without batching: 1000 writes (one per node)
		assert.equal(writeCount, 1, 'Should batch 1000 text nodes into 1 write (99.9% reduction!)');
	});

	it('should batch mixed text and html-string nodes', async () => {
		const result = createMockResult();
		const { markHTMLString } = await import('../../../dist/runtime/server/escape.js');

		const items = [
			'Text 1',
			markHTMLString('<b>Bold</b>'),
			'Text 2',
			markHTMLString('<i>Italic</i>'),
		];

		const queue = await buildRenderQueue(items, result);

		let writeCount = 0;
		let output = '';
		const destination = {
			write(chunk) {
				writeCount++;
				output += String(chunk);
			},
		};

		const { renderQueue } = await import('../../../dist/runtime/server/render/queue/index.js');
		await renderQueue(queue, destination);

		// All should be batched since they're all batchable types
		assert.equal(writeCount, 1);
		assert.equal(output, 'Text 1<b>Bold</b>Text 2<i>Italic</i>');
	});
});
