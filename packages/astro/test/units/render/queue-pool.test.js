import { describe, it } from 'node:test';
import { strictEqual, notStrictEqual } from 'node:assert';
import { NodePool } from '../../../dist/runtime/server/render/queue/pool.js';

describe('NodePool', () => {
	it('should acquire a new node when pool is empty', () => {
		const pool = new NodePool();
		const node = pool.acquire('text');

		strictEqual(node.type, 'text');
		strictEqual(node.content, ''); // Default value for new TextNode
	});

	it('should reuse released nodes of the same type', () => {
		const pool = new NodePool();

		// Acquire and set up a text node
		const node1 = pool.acquire('text');
		node1.content = 'Hello';

		// Release it back to the pool
		pool.release(node1);
		strictEqual(pool.size(), 1);

		// Acquire another text node - should reuse the same object
		const node2 = pool.acquire('text');
		strictEqual(node2.type, 'text');
		strictEqual(node2.content, ''); // Content was reset on release
		strictEqual(node1, node2); // Same object reference (actual reuse)

		// Pool size should decrease (node was consumed from the text sub-pool)
		strictEqual(pool.size(), 0);
	});

	it('should not reuse released nodes across different types', () => {
		const pool = new NodePool();

		// Acquire and release a text node
		const node1 = pool.acquire('text');
		node1.content = 'Hello';
		pool.release(node1);
		strictEqual(pool.size(), 1);

		// Acquire an html-string node - should NOT reuse the text node
		const node2 = pool.acquire('html-string');
		strictEqual(node2.type, 'html-string');
		strictEqual(node2.html, '');

		// Text node still in the text sub-pool (html-string pool was empty)
		strictEqual(pool.size(), 1);
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

		// First cycle - acquire and release text nodes
		const batch1 = [];
		for (let i = 0; i < 5; i++) {
			batch1.push(pool.acquire('text'));
		}
		pool.releaseAll(batch1);
		strictEqual(pool.size(), 5);

		// Second cycle - reuse from the same type (text) sub-pool
		const batch2 = [];
		for (let i = 0; i < 3; i++) {
			batch2.push(pool.acquire('text'));
		}
		strictEqual(pool.size(), 2); // 5 - 3 = 2 remaining in text pool

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

	it('should return the same object reference when reusing pooled nodes', () => {
		const pool = new NodePool();

		// Test all four node types for identity reuse
		const types = ['text', 'html-string', 'component', 'instruction'];

		for (const type of types) {
			const original = pool.acquire(type);
			pool.release(original);
			const reused = pool.acquire(type);
			strictEqual(original, reused, `${type} node should be same object after reuse`);
		}
	});

	it('should clear references on component and instruction nodes when released', () => {
		const pool = new NodePool();

		// Component node - instance should be cleared
		const compNode = pool.acquire('component');
		compNode.instance = { render: () => {} }; // Simulate a component instance
		pool.release(compNode);

		const reusedComp = pool.acquire('component');
		strictEqual(reusedComp, compNode); // Same object
		strictEqual(reusedComp.instance, undefined); // Instance cleared on release

		// Instruction node - instruction should be cleared
		const instrNode = pool.acquire('instruction');
		instrNode.instruction = { type: 'head' }; // Simulate an instruction
		pool.release(instrNode);

		const reusedInstr = pool.acquire('instruction');
		strictEqual(reusedInstr, instrNode); // Same object
		strictEqual(reusedInstr.instruction, undefined); // Instruction cleared on release
	});

	it('should track pool size across mixed types correctly', () => {
		const pool = new NodePool(10);

		// Release nodes of different types
		const text1 = pool.acquire('text');
		const text2 = pool.acquire('text');
		const html1 = pool.acquire('html-string');
		const comp1 = pool.acquire('component');
		const instr1 = pool.acquire('instruction');

		pool.releaseAll([text1, text2, html1, comp1, instr1]);
		strictEqual(pool.size(), 5); // Total across all sub-pools

		// Acquire from specific types - only those sub-pools decrease
		pool.acquire('text');
		strictEqual(pool.size(), 4);

		pool.acquire('text');
		strictEqual(pool.size(), 3);

		// Text sub-pool is now empty; acquiring another text creates new (no change to pool size)
		const newText = pool.acquire('text');
		strictEqual(pool.size(), 3); // Still 3 (html, component, instruction remain)
		notStrictEqual(newText, text1); // Not reused - new object
		notStrictEqual(newText, text2); // Not reused - new object
	});

	it('should apply shared maxSize cap across all sub-pools', () => {
		const pool = new NodePool(3); // Max 3 total across all types

		const text1 = pool.acquire('text');
		const html1 = pool.acquire('html-string');
		const comp1 = pool.acquire('component');
		const instr1 = pool.acquire('instruction');

		pool.release(text1); // 1/3
		pool.release(html1); // 2/3
		pool.release(comp1); // 3/3
		pool.release(instr1); // Exceeds cap - dropped

		strictEqual(pool.size(), 3);

		// The instruction node was dropped, so acquiring instruction creates new
		const newInstr = pool.acquire('instruction');
		notStrictEqual(newInstr, instr1);
	});

	it('should set content on reused nodes via acquire', () => {
		const pool = new NodePool();

		// Release a text node
		const node = pool.acquire('text');
		node.content = 'old content';
		pool.release(node);

		// Acquire with content parameter - content should be set on the reused node
		const reused = pool.acquire('text', 'new content');
		strictEqual(reused, node); // Same object
		strictEqual(reused.content, 'new content');
	});

	it('should clear all sub-pools on clear()', () => {
		const pool = new NodePool();

		// Release one of each type
		const nodes = [
			pool.acquire('text'),
			pool.acquire('html-string'),
			pool.acquire('component'),
			pool.acquire('instruction'),
		];
		pool.releaseAll(nodes);
		strictEqual(pool.size(), 4);

		pool.clear();
		strictEqual(pool.size(), 0);

		// Acquiring after clear should create new objects (not reuse)
		const newText = pool.acquire('text');
		notStrictEqual(newText, nodes[0]);
	});
});
