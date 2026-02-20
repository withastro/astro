import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert';
import { NodePool } from '../../../dist/runtime/server/render/queue/pool.js';

describe('NodePool', () => {
	it('should acquire a new node when pool is empty', () => {
		const pool = new NodePool();
		const node = pool.acquire('text');

		strictEqual(node.type, 'text');
		strictEqual(node.content, ''); // Default value for new TextNode
	});

	it('should reuse released nodes', () => {
		const pool = new NodePool();

		// Acquire and set up a node
		const node1 = pool.acquire('text');
		node1.content = 'Hello';

		// Release it back to the pool
		pool.release(node1);
		strictEqual(pool.size(), 1);

		// Acquire another node - with discriminated union, we create a fresh node
		const node2 = pool.acquire('html-string');
		strictEqual(node2.type, 'html-string'); // Type is html-string
		strictEqual(node2.html, ''); // Default value for new HtmlStringNode

		// Pool size should decrease (node was consumed from pool)
		strictEqual(pool.size(), 0);
	});

	it('should respect maxSize limit', () => {
		const pool = new NodePool(2); // Max size of 2

		const node1 = pool.acquire('text');
		const node2 = pool.acquire('text');
		const node3 = pool.acquire('text');

		pool.release(node1);
		pool.release(node2);
		pool.release(node3); // Should be discarded

		strictEqual(pool.size(), 2); // Only 2 nodes retained
	});

	it('should clear the pool', () => {
		const pool = new NodePool();

		// Acquire nodes first, then release them all at once
		const node1 = pool.acquire('text');
		const node2 = pool.acquire('text');
		const node3 = pool.acquire('text');

		pool.release(node1);
		pool.release(node2);
		pool.release(node3);

		strictEqual(pool.size(), 3);

		pool.clear();
		strictEqual(pool.size(), 0);
	});

	it('should release all nodes in an array', () => {
		const pool = new NodePool();

		const nodes = [pool.acquire('text'), pool.acquire('html-string'), pool.acquire('component')];

		pool.releaseAll(nodes);
		strictEqual(pool.size(), 3);
	});

	it('should properly create nodes with correct discriminated union types', () => {
		const pool = new NodePool();

		// Acquire different node types
		const textNode = pool.acquire('text');
		const htmlNode = pool.acquire('html-string');
		const componentNode = pool.acquire('component');
		const instructionNode = pool.acquire('instruction');

		// Each node should have only its relevant fields (discriminated union)
		strictEqual(textNode.type, 'text');
		strictEqual(textNode.content, '');

		strictEqual(htmlNode.type, 'html-string');
		strictEqual(htmlNode.html, '');

		strictEqual(componentNode.type, 'component');
		strictEqual(componentNode.instance, undefined);

		strictEqual(instructionNode.type, 'instruction');
		strictEqual(instructionNode.instruction, undefined);
	});

	it('should handle multiple acquire/release cycles', () => {
		const pool = new NodePool(10);

		// First cycle
		const batch1 = [];
		for (let i = 0; i < 5; i++) {
			batch1.push(pool.acquire('text'));
		}
		pool.releaseAll(batch1);
		strictEqual(pool.size(), 5);

		// Second cycle - should reuse from pool
		const batch2 = [];
		for (let i = 0; i < 3; i++) {
			batch2.push(pool.acquire('html-string'));
		}
		strictEqual(pool.size(), 2); // 5 - 3 = 2 remaining

		pool.releaseAll(batch2);
		strictEqual(pool.size(), 5); // 2 + 3 = 5
	});

	it('should work correctly with default maxSize', () => {
		const pool = new NodePool(); // Default maxSize = 1000

		// Create and release many nodes
		const nodes = [];
		for (let i = 0; i < 100; i++) {
			nodes.push(pool.acquire('text'));
		}

		pool.releaseAll(nodes);
		strictEqual(pool.size(), 100);

		// All should be reusable
		for (let i = 0; i < 100; i++) {
			pool.acquire('text');
		}
		strictEqual(pool.size(), 0); // All reused
	});
});
