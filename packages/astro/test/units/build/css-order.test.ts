import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeInlineCss } from '../../../dist/core/build/runtime.js';

describe('mergeInlineCss', () => {
	it('merges consecutive inline CSS chunks', () => {
		const result = [
			{ type: 'inline' as const, content: '.a{color:red}' },
			{ type: 'inline' as const, content: '.b{color:blue}' },
		].reduce(mergeInlineCss, []);
		assert.equal(result.length, 1);
		assert.equal(result[0].type, 'inline');
		assert.equal((result[0] as any).content, '.a{color:red}.b{color:blue}');
	});

	it('does not merge when current chunk contains @import', () => {
		const result = [
			{ type: 'inline' as const, content: '.a{color:red}' },
			{ type: 'inline' as const, content: '@import "https://example.com/font.css";.b{color:blue}' },
		].reduce(mergeInlineCss, []);
		assert.equal(result.length, 2);
		assert.equal((result[0] as any).content, '.a{color:red}');
		assert.equal(
			(result[1] as any).content,
			'@import "https://example.com/font.css";.b{color:blue}',
		);
	});

	it('does not merge when previous chunk contains @import', () => {
		const result = [
			{ type: 'inline' as const, content: '@import "https://example.com/font.css";.a{color:red}' },
			{ type: 'inline' as const, content: '.b{color:blue}' },
		].reduce(mergeInlineCss, []);
		assert.equal(result.length, 2);
	});

	it('does not merge when both chunks contain @import', () => {
		const result = [
			{ type: 'inline' as const, content: '@import "a.css";.a{}' },
			{ type: 'inline' as const, content: '@import "b.css";.b{}' },
		].reduce(mergeInlineCss, []);
		assert.equal(result.length, 2);
	});

	it('preserves external stylesheets as boundaries', () => {
		const result = [
			{ type: 'inline' as const, content: '.a{}' },
			{ type: 'external' as const, src: '/style.css' },
			{ type: 'inline' as const, content: '.b{}' },
		].reduce(mergeInlineCss, []);
		assert.equal(result.length, 3);
	});

	it('merges non-import chunks around an import chunk', () => {
		const result = [
			{ type: 'inline' as const, content: '.a{}' },
			{ type: 'inline' as const, content: '.b{}' },
			{ type: 'inline' as const, content: '@import "font.css";.c{}' },
			{ type: 'inline' as const, content: '.d{}' },
			{ type: 'inline' as const, content: '.e{}' },
		].reduce(mergeInlineCss, []);
		// .a and .b merge, @import stays alone, .d and .e merge
		assert.equal(result.length, 3);
		assert.equal((result[0] as any).content, '.a{}.b{}');
		assert.equal((result[1] as any).content, '@import "font.css";.c{}');
		assert.equal((result[2] as any).content, '.d{}.e{}');
	});
});
