import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { originPathnameSymbol } from '../../../dist/core/constants.js';
import { getOriginPathname, setOriginPathname } from '../../../dist/core/routing/rewrite.js';

describe('setOriginPathname', () => {
	describe('with trailingSlash = "always"', () => {
		it('should append slash to pathname without extension', () => {
			const request = new Request('https://example.com/about');
			setOriginPathname(request, '/about', 'always', 'directory');
			const stored = Reflect.get(request, originPathnameSymbol);
			assert.equal(decodeURIComponent(stored), '/about/');
		});

		it('should append slash to pathname with extension when format is directory', () => {
			const request = new Request('https://example.com/file.json');
			setOriginPathname(request, '/file.json', 'always', 'directory');
			const stored = Reflect.get(request, originPathnameSymbol);
			assert.equal(decodeURIComponent(stored), '/file.json/');
		});

		it('should append slash when format is file (always means always)', () => {
			const request = new Request('https://example.com/about');
			setOriginPathname(request, '/about', 'always', 'file');
			const stored = Reflect.get(request, originPathnameSymbol);
			assert.equal(decodeURIComponent(stored), '/about/');
		});

		it('should keep existing trailing slash', () => {
			const request = new Request('https://example.com/about/');
			setOriginPathname(request, '/about/', 'always', 'directory');
			const stored = Reflect.get(request, originPathnameSymbol);
			assert.equal(decodeURIComponent(stored), '/about/');
		});
	});

	describe('with trailingSlash = "never"', () => {
		it('should remove trailing slash from pathname', () => {
			const request = new Request('https://example.com/about/');
			setOriginPathname(request, '/about/', 'never', 'directory');
			const stored = Reflect.get(request, originPathnameSymbol);
			assert.equal(decodeURIComponent(stored), '/about');
		});

		it('should not add slash to pathname without slash', () => {
			const request = new Request('https://example.com/about');
			setOriginPathname(request, '/about', 'never', 'directory');
			const stored = Reflect.get(request, originPathnameSymbol);
			assert.equal(decodeURIComponent(stored), '/about');
		});

		it('should remove slash from pathname with extension', () => {
			const request = new Request('https://example.com/file.json/');
			setOriginPathname(request, '/file.json/', 'never', 'directory');
			const stored = Reflect.get(request, originPathnameSymbol);
			assert.equal(decodeURIComponent(stored), '/file.json');
		});
	});

	describe('with trailingSlash = "ignore"', () => {
		it('should append slash when format is directory', () => {
			const request = new Request('https://example.com/about');
			setOriginPathname(request, '/about', 'ignore', 'directory');
			const stored = Reflect.get(request, originPathnameSymbol);
			assert.equal(decodeURIComponent(stored), '/about/');
		});

		it('should not append slash when format is file', () => {
			const request = new Request('https://example.com/about');
			setOriginPathname(request, '/about', 'ignore', 'file');
			const stored = Reflect.get(request, originPathnameSymbol);
			assert.equal(decodeURIComponent(stored), '/about');
		});

		it('should keep existing trailing slash with directory format', () => {
			const request = new Request('https://example.com/about/');
			setOriginPathname(request, '/about/', 'ignore', 'directory');
			const stored = Reflect.get(request, originPathnameSymbol);
			assert.equal(decodeURIComponent(stored), '/about/');
		});

		it('should remove trailing slash with file format', () => {
			const request = new Request('https://example.com/about/');
			setOriginPathname(request, '/about/', 'ignore', 'file');
			const stored = Reflect.get(request, originPathnameSymbol);
			assert.equal(decodeURIComponent(stored), '/about');
		});
	});

	describe('special cases', () => {
		it('should handle root path with trailing slash always', () => {
			const request = new Request('https://example.com/');
			setOriginPathname(request, '/', 'always', 'directory');
			const stored = Reflect.get(request, originPathnameSymbol);
			assert.equal(decodeURIComponent(stored), '/');
		});

		it('should handle root path with trailing slash never', () => {
			const request = new Request('https://example.com/');
			setOriginPathname(request, '/', 'never', 'directory');
			const stored = Reflect.get(request, originPathnameSymbol);
			// Root path always keeps its slash
			assert.equal(decodeURIComponent(stored), '/');
		});

		it('should encode special characters', () => {
			const request = new Request('https://example.com/path%20with%20spaces');
			setOriginPathname(request, '/path with spaces', 'always', 'directory');
			const stored = Reflect.get(request, originPathnameSymbol);
			// The stored value should be URL encoded
			assert.equal(stored, encodeURIComponent('/path with spaces/'));
		});
	});
});

describe('getOriginPathname', () => {
	it('should retrieve the stored pathname', () => {
		const request = new Request('https://example.com/current');
		setOriginPathname(request, '/original', 'always', 'directory');
		const retrieved = getOriginPathname(request);
		assert.equal(retrieved, '/original/');
	});

	it('should return current URL pathname if no origin is stored', () => {
		const request = new Request('https://example.com/current/path');
		const retrieved = getOriginPathname(request);
		assert.equal(retrieved, '/current/path');
	});
});
