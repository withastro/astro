import assert from 'node:assert';
import { describe, it } from 'node:test';
import { findTopLevelReturnPositions } from '../../dist/core/astro2tsx.js';

describe('findTopLevelReturnPositions', () => {
	it('detects bare top-level return', () => {
		const source = 'return notFound();';
		const positions = findTopLevelReturnPositions(source);
		assert.deepStrictEqual(positions, [0]);
	});

	it('detects return inside if without braces', () => {
		const source = 'if (!slug) return notFound();';
		const positions = findTopLevelReturnPositions(source);
		assert.deepStrictEqual(positions, [11]);
	});

	it('detects return inside if with braces', () => {
		const source = 'if (!slug) { return notFound(); }';
		const positions = findTopLevelReturnPositions(source);
		assert.deepStrictEqual(positions, [13]);
	});

	it('does not detect return inside arrow function', () => {
		const source = 'const fn = () => { return 42; };';
		const positions = findTopLevelReturnPositions(source);
		assert.deepStrictEqual(positions, []);
	});

	it('does not detect return inside function declaration', () => {
		const source = 'function fn() { return 42; }';
		const positions = findTopLevelReturnPositions(source);
		assert.deepStrictEqual(positions, []);
	});

	it('does not detect return inside function expression', () => {
		const source = 'const fn = function() { return 42; };';
		const positions = findTopLevelReturnPositions(source);
		assert.deepStrictEqual(positions, []);
	});

	it('does not detect return inside method shorthand', () => {
		const source = '({ method() { return 42; } })';
		const positions = findTopLevelReturnPositions(source);
		assert.deepStrictEqual(positions, []);
	});

	it('detects top-level return but not nested ones', () => {
		const source = `const notFound = () => {
  return new Response(null, { status: 404 });
};

const slug = undefined;

if (!slug) return notFound();`;
		const positions = findTopLevelReturnPositions(source);
		assert.strictEqual(positions.length, 1);
		assert.strictEqual(source.substring(positions[0], positions[0] + 6), 'return');
		// Verify it's the correct return (the top-level one, not the one inside the arrow)
		assert.ok(source.substring(positions[0]).startsWith('return notFound()'));
	});

	it('ignores return in string literals', () => {
		const source = `const s = "return value"; return 42;`;
		const positions = findTopLevelReturnPositions(source);
		assert.strictEqual(positions.length, 1);
		assert.ok(source.substring(positions[0]).startsWith('return 42'));
	});

	it('ignores return in comments', () => {
		const source = `// return early\n/* return */ return 42;`;
		const positions = findTopLevelReturnPositions(source);
		assert.strictEqual(positions.length, 1);
		assert.ok(source.substring(positions[0]).startsWith('return 42'));
	});

	it('ignores return in template literals', () => {
		const source = 'const s = `return ${val}`; return 42;';
		const positions = findTopLevelReturnPositions(source);
		assert.strictEqual(positions.length, 1);
		assert.ok(source.substring(positions[0]).startsWith('return 42'));
	});

	it('handles multiple top-level returns', () => {
		const source = 'if (a) return 1;\nif (b) return 2;';
		const positions = findTopLevelReturnPositions(source);
		assert.strictEqual(positions.length, 2);
	});

	it('does not detect return inside async arrow function', () => {
		const source = 'const fn = async () => { return 42; };';
		const positions = findTopLevelReturnPositions(source);
		assert.deepStrictEqual(positions, []);
	});

	it('handles concise arrow followed by block statement', () => {
		const source = 'const fn = () => expr;\nif (cond) { return 42; }';
		const positions = findTopLevelReturnPositions(source);
		assert.strictEqual(positions.length, 1);
		assert.ok(source.substring(positions[0]).startsWith('return 42'));
	});
});
