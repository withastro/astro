import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import { setAmbientManifest } from '../../../dist/core/manifest/ambient.js';
import { i18n, pages } from '../../../dist/core/hono/index.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createPage, createTestApp } from '../mocks.ts';

const indexPage = createComponent(() => render`<h1>index</h1>`);

describe('astro/hono i18n()', () => {
	it('redirects to the default locale when mounted before pages()', async () => {
		const app = createTestApp([createPage(indexPage, { route: '/' })], {
			i18n: {
				defaultLocale: 'en',
				locales: ['en', 'fr'],
				strategy: 'pathname-prefix-always',
				fallbackType: 'rewrite',
				fallback: {},
				domains: {},
				domainLookupTable: {},
			},
		});
		setAmbientManifest(app.manifest);
		const hono = new Hono();
		hono.use(i18n());
		hono.use(pages());

		const res = await hono.fetch(new Request('http://localhost/'));

		assert.equal(res.status, 302);
		assert.equal(res.headers.get('location'), '/en/');
	});
});
