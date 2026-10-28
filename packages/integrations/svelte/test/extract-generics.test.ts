import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractGenerics } from '../dist/editor.cjs';

describe('extractGenerics', () => {
	it('should return null when no __sveltets_Render class is present', () => {
		const tsx = 'const $$Component = __sveltets_2_isomorphic_component($$render());';
		assert.equal(extractGenerics(tsx), null);
	});

	it('should extract a single type parameter', () => {
		const tsx = 'class __sveltets_Render<T> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, { params: 'T', names: 'T' });
	});

	it('should extract a single type parameter with constraint', () => {
		const tsx = 'class __sveltets_Render<T extends boolean = false> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, { params: 'T extends boolean = false', names: 'T' });
	});

	it('should extract multiple type parameters', () => {
		const tsx = 'class __sveltets_Render<T, U> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, { params: 'T, U', names: 'T, U' });
	});

	it('should extract multiple type parameters with constraints', () => {
		const tsx = 'class __sveltets_Render<T extends string, U extends number = 0> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, {
			params: 'T extends string, U extends number = 0',
			names: 'T, U',
		});
	});

	it('should handle nested angle brackets in constraints', () => {
		const tsx = 'class __sveltets_Render<T extends Record<string, unknown>, U extends keyof T> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, {
			params: 'T extends Record<string, unknown>, U extends keyof T',
			names: 'T, U',
		});
	});

	it('should handle deeply nested angle brackets', () => {
		const tsx = 'class __sveltets_Render<T extends Map<string, Set<number>>> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, {
			params: 'T extends Map<string, Set<number>>',
			names: 'T',
		});
	});

	it('should handle arrow function types in constraints', () => {
		const tsx = 'class __sveltets_Render<T extends (val: string) => boolean> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, {
			params: 'T extends (val: string) => boolean',
			names: 'T',
		});
	});

	it('should handle arrow function returning generic type', () => {
		const tsx = 'class __sveltets_Render<T extends (x: number) => Promise<string>> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, {
			params: 'T extends (x: number) => Promise<string>',
			names: 'T',
		});
	});

	it('should handle arrow function with multiple params after comma', () => {
		const tsx = 'class __sveltets_Render<T extends (a: string) => boolean, U extends T> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, {
			params: 'T extends (a: string) => boolean, U extends T',
			names: 'T, U',
		});
	});

	it('should handle const modifier on type parameter', () => {
		const tsx = 'class __sveltets_Render<const T extends readonly string[]> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, {
			params: 'const T extends readonly string[]',
			names: 'T',
		});
	});

	it('should handle object literal with commas in constraint', () => {
		const tsx = 'class __sveltets_Render<T extends { a: string, b: number }> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, {
			params: 'T extends { a: string, b: number }',
			names: 'T',
		});
	});

	it('should handle object literal with commas and a second param', () => {
		const tsx =
			'class __sveltets_Render<T extends { a: string, b: number }, U extends keyof T> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, {
			params: 'T extends { a: string, b: number }, U extends keyof T',
			names: 'T, U',
		});
	});

	it('should handle tuple type with commas in constraint', () => {
		const tsx = 'class __sveltets_Render<T extends [string, number]> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, {
			params: 'T extends [string, number]',
			names: 'T',
		});
	});

	it('should handle parenthesized function params with commas', () => {
		const tsx = 'class __sveltets_Render<T extends (a: number, b: string) => void> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, {
			params: 'T extends (a: number, b: string) => void',
			names: 'T',
		});
	});

	it('should handle nested object literals with commas', () => {
		const tsx = 'class __sveltets_Render<T extends { a: { x: string }, b: number }> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, {
			params: 'T extends { a: { x: string }, b: number }',
			names: 'T',
		});
	});

	it('should handle nested arrow function in constraint', () => {
		const tsx = 'class __sveltets_Render<T extends (f: (x: string) => number) => boolean> { }';
		const result = extractGenerics(tsx);
		assert.deepEqual(result, {
			params: 'T extends (f: (x: string) => number) => boolean',
			names: 'T',
		});
	});
});
