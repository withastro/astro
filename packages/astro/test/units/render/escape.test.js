// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	escapeHTML,
	isHTMLString,
	markHTMLString,
	unescapeHTML,
} from '../../../dist/runtime/server/escape.js';

describe('markHTMLString', () => {
	it('wraps a string in an HTMLString instance', () => {
		const result = markHTMLString('hello');
		assert.ok(isHTMLString(result), 'should be an HTMLString');
		assert.equal(String(result), 'hello');
	});

	it('returns the value unchanged if already an HTMLString', () => {
		const original = markHTMLString('hello');
		const again = markHTMLString(original);
		assert.ok(isHTMLString(again));
		assert.equal(String(again), 'hello');
	});
});

describe('isHTMLString', () => {
	it('returns true for HTMLString instances', () => {
		assert.equal(isHTMLString(markHTMLString('hello')), true);
	});

	it('returns false for plain strings', () => {
		assert.equal(isHTMLString('hello'), false);
	});

	it('returns false for null and undefined', () => {
		assert.equal(isHTMLString(null), false);
		assert.equal(isHTMLString(undefined), false);
	});

	it('returns false for numbers and objects', () => {
		assert.equal(isHTMLString(42), false);
		assert.equal(isHTMLString({}), false);
	});
});

describe('escapeHTML', () => {
	it('escapes < and > to &lt; and &gt;', () => {
		const result = String(escapeHTML('<script>alert("xss")</script>'));
		assert.equal(result, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
	});

	it('escapes & to &amp;', () => {
		assert.equal(String(escapeHTML('a & b')), 'a &amp; b');
	});

	it('escapes " to &quot;', () => {
		assert.equal(String(escapeHTML('"hello"')), '&quot;hello&quot;');
	});

	it("escapes ' to &#39;", () => {
		assert.equal(String(escapeHTML("it's")), 'it&#39;s');
	});

	it('escapes a plain string and returns a string', () => {
		const result = escapeHTML('<b>test</b>');
		assert.equal(typeof result, 'string');
		assert.equal(result, '&lt;b&gt;test&lt;/b&gt;');
	});
});

describe('unescapeHTML', () => {
	it('can take a string of HTML — Migrated from test/set-html.test.js', async () => {
		const result = unescapeHTML('<b>bold</b>');
		assert.ok(isHTMLString(result), 'should return an HTMLString');
		assert.equal(String(result), '<b>bold</b>');
	});

	it('can take a Promise to a string of HTML — Migrated from test/set-html.test.js', async () => {
		const result = await unescapeHTML(Promise.resolve('<b>bold</b>'));
		assert.ok(isHTMLString(result));
		assert.ok(String(result).includes('<b>bold</b>'));
	});

	it('can take an Iterator — Migrated from test/set-html.test.js', async () => {
		function* gen() {
			yield '<li>1</li>';
			yield '<li>2</li>';
		}
		const result = unescapeHTML(gen());
		const chunks = [];
		for await (const chunk of result) {
			chunks.push(String(chunk));
		}
		assert.ok(chunks.join('').includes('<li>1</li>'));
		assert.ok(chunks.join('').includes('<li>2</li>'));
	});

	it('can take an AsyncIterator', async () => {
		async function* gen() {
			yield '<li>a</li>';
			yield '<li>b</li>';
		}
		const result = unescapeHTML(gen());
		const chunks = [];
		for await (const chunk of result) {
			chunks.push(String(chunk));
		}
		assert.ok(chunks.join('').includes('<li>a</li>'));
	});

	it('can take a Response', async () => {
		const response = new Response('<p>hello</p>', { headers: { 'content-type': 'text/html' } });
		const result = unescapeHTML(response);
		const chunks = [];
		const dec = new TextDecoder();
		for await (const chunk of result) {
			chunks.push(chunk instanceof Uint8Array ? dec.decode(chunk) : String(chunk));
		}
		assert.ok(chunks.join('').includes('<p>hello</p>'));
	});

	it('can take a ReadableStream', async () => {
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue('<span>stream</span>');
				controller.close();
			},
		});
		const result = unescapeHTML(stream);
		const chunks = [];
		for await (const chunk of result) {
			chunks.push(String(chunk));
		}
		assert.ok(chunks.join('').includes('<span>stream</span>'));
	});
});
