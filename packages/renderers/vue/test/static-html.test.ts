import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import StaticHtml from '../src/static-html.ts';

describe('StaticHtml', () => {
	it('coerces String-wrapped HTML so Vue SSR sees a primitive innerHTML', async () => {
		// Astro's SlotString extends String; typeof is "object", not "string".
		// Vue's SSR buffer then walks it character by character (#18392).
		const payload = `<span id="slot">${'x'.repeat(256)}</span>`;
		const value = new String(payload);
		assert.equal(typeof value, 'object');
		assert.notEqual(typeof value, 'string');

		const app = createSSRApp({
			setup() {
				return () =>
					h(StaticHtml, {
						value: value as unknown as string,
						hydrate: true,
					});
			},
		});
		const out = await renderToString(app);
		assert.match(out, /<astro-slot/);
		assert.ok(out.includes(payload));

		// Primitive strings still render (static slots use astro-static-slot).
		const app2 = createSSRApp({
			setup() {
				return () => h(StaticHtml, { value: payload, hydrate: false });
			},
		});
		const out2 = await renderToString(app2);
		assert.match(out2, /<astro-static-slot/);
		assert.ok(out2.includes(payload));
	});

	it('returns null for empty values', async () => {
		const app = createSSRApp({
			setup() {
				return () => h(StaticHtml, { value: '', hydrate: true });
			},
		});
		const html = await renderToString(app);
		assert.equal(html, '<!---->');
	});
});
