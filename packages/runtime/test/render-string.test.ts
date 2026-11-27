import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createComponent, render } from '../dist/compiler/index.js';
import { createRenderer } from '../dist/render.js';

// `renderToString()` skips the Response round trip; its output must stay what `renderToResponse().text()` gives.
const page = (text: string) =>
	createComponent(() => render`<p>${text}</p>`) as Parameters<
		ReturnType<typeof createRenderer>['renderToString']
	>[0];

const viaResponse = async (text: string) =>
	createRenderer({ compressHTML: false })
		.renderToResponse(page(text), { partial: true })
		.then((r) => r.text());

describe('renderToString() output matches the Response round trip', () => {
	const cases: Record<string, string> = {
		'plain text': 'hello',
		'non-ASCII': 'café 中文 😀',
		'a lone high surrogate': 'a\ud800b',
		'a lone low surrogate': 'a\udc00b',
		'a surrogate pair split across text': '\ud83d' + '\ude00',
		'a high surrogate at the end': 'end\ud83d',
		'a leading BOM': '﻿after bom',
	};
	for (const [name, text] of Object.entries(cases)) {
		it(`${name}`, async () => {
			const renderer = createRenderer({ compressHTML: false });
			const got = await renderer.renderToString(page(text), { partial: true });
			assert.equal(got, await viaResponse(text));
		});
	}

	it('turns lone surrogates into U+FFFD', async () => {
		const got = await createRenderer().renderToString(page('a\ud800b\udc00c'), { partial: true });
		assert.equal(got, '<p>a�b�c</p>');
	});

	it('drops a BOM at the very start of a page, as TextDecoder does', async () => {
		const bom = createComponent(() => render`﻿<p>x</p>`) as Parameters<
			ReturnType<typeof createRenderer>['renderToString']
		>[0];
		const got = await createRenderer().renderToString(bom, { partial: true });
		assert.equal(got, '<p>x</p>');
		assert.equal(
			got,
			await createRenderer()
				.renderToResponse(bom, { partial: true })
				.then((r) => r.text()),
		);
	});

	it('still exposes Astro.request, url and the default response headers on demand', async () => {
		const seen: Record<string, unknown> = {};
		const Probe = createComponent((result: any) => {
			const astro = result.createAstro({}, {});
			seen.url = astro.url.href;
			seen.method = astro.request.method;
			seen.pathname = result.pathname;
			seen.type = result.response.headers.get('Content-Type');
			return render`<i></i>`;
		}) as Parameters<ReturnType<typeof createRenderer>['renderToString']>[0];
		await createRenderer().renderToString(Probe, { partial: true });
		assert.deepEqual(seen, {
			url: 'http://localhost/',
			method: 'GET',
			pathname: '/',
			type: 'text/html',
		});
		const request = new Request('http://example.com/a/b');
		await createRenderer().renderToString(Probe, { partial: true, request });
		assert.equal(seen.url, 'http://example.com/a/b');
		assert.equal(seen.pathname, '/a/b');
	});

	it('does not read the global Response while rendering a string', async () => {
		const real = Object.getOwnPropertyDescriptor(globalThis, 'Response');
		let reads = 0;
		Object.defineProperty(globalThis, 'Response', {
			configurable: true,
			get() {
				reads++;
				return real?.value;
			},
		});
		try {
			await createRenderer().renderToString(page('x'), { partial: true });
		} finally {
			if (real) Object.defineProperty(globalThis, 'Response', real);
		}
		assert.equal(reads, 0);
	});
});
