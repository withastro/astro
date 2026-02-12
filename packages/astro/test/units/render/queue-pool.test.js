import { describe, it } from 'node:test';
import { strictEqual, ok } from 'node:assert';
import { QueueNodePool } from '../../../dist/runtime/server/render/queue/pool.js';

describe('QueueNodePool', () => {
	it('should acquire a new node when pool is empty', () => {
		const pool = new QueueNodePool();
		const node = pool.acquire('text');

		strictEqual(node.type, 'text');
		strictEqual(node.parent, undefined);
		strictEqual(node.content, undefined);
	});

	it('should reuse released nodes', () => {
		const pool = new QueueNodePool();

		// Acquire and set up a node
		const node1 = pool.acquire('text');
		node1.content = 'Hello';
		node1.parent = { type: 'element' };
		node1.position = 5;

		// Release it back to the pool
		pool.release(node1);
		strictEqual(pool.size(), 1);

		// Acquire another node - should get the same instance but reset
		const node2 = pool.acquire('html-string');
		strictEqual(node2.type, 'html-string'); // Type updated
		strictEqual(node2.content, undefined); // Content cleared
		strictEqual(node2.parent, undefined); // Parent cleared
		strictEqual(node2.position, undefined); // Position cleared

		// Should be the same object reference (pool reuse)
		strictEqual(node1, node2);
	});

	it('should respect maxSize limit', () => {
		const pool = new QueueNodePool(2); // Max size of 2

		const node1 = pool.acquire('text');
		const node2 = pool.acquire('text');
		const node3 = pool.acquire('text');

		pool.release(node1);
		pool.release(node2);
		pool.release(node3); // Should be discarded

		strictEqual(pool.size(), 2); // Only 2 nodes retained
	});

	it('should clear the pool', () => {
		const pool = new QueueNodePool();

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
		const pool = new QueueNodePool();

		const nodes = [pool.acquire('text'), pool.acquire('html-string'), pool.acquire('component')];

		pool.releaseAll(nodes);
		strictEqual(pool.size(), 3);
	});

	it('should properly reset all node fields', () => {
		const pool = new QueueNodePool();

		// Create a fully populated node
		const node = pool.acquire('component');
		node.parent = { type: 'element' };
		node.children = [];
		node.tagName = 'div';
		node.props = { id: 'test' };
		node.hasChildren = true;
		node.factory = () => {};
		node.instance = {};
		node.isPropagator = true;
		node.displayName = 'TestComponent';
		node.promise = Promise.resolve();
		node.resolved = true;
		node.resolvedValue = 'value';
		node.content = 'content';
		node.html = '<div></div>';
		node.instruction = { type: 'head' };
		node.slotName = 'default';
		node.slotFn = () => {};
		node.originalValue = 'original';
		node.position = 10;

		// Release and re-acquire
		pool.release(node);
		const reused = pool.acquire('text');

		// Should be the same instance
		strictEqual(node, reused);

		// All fields should be reset except type
		strictEqual(reused.type, 'text');
		strictEqual(reused.parent, undefined);
		strictEqual(reused.children, undefined);
		strictEqual(reused.tagName, undefined);
		strictEqual(reused.props, undefined);
		strictEqual(reused.hasChildren, undefined);
		strictEqual(reused.factory, undefined);
		strictEqual(reused.instance, undefined);
		strictEqual(reused.isPropagator, undefined);
		strictEqual(reused.displayName, undefined);
		strictEqual(reused.promise, undefined);
		strictEqual(reused.resolved, undefined);
		strictEqual(reused.resolvedValue, undefined);
		strictEqual(reused.content, undefined);
		strictEqual(reused.html, undefined);
		strictEqual(reused.instruction, undefined);
		strictEqual(reused.slotName, undefined);
		strictEqual(reused.slotFn, undefined);
		strictEqual(reused.originalValue, undefined);
		strictEqual(reused.position, undefined);
	});

	it('should handle multiple acquire/release cycles', () => {
		const pool = new QueueNodePool(10);

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
		const pool = new QueueNodePool(); // Default maxSize = 1000

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
