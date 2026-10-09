import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createComponent } from '../../../dist/runtime/server/index.js';
import { createPage, createTestApp } from '../mocks.ts';

/**
 * Tests that returning a non-Response value from a page component produces an error.
 *
 * The rendering runtime (render/astro/render.ts) checks that component factories
 * return either a Response, HeadAndContent, or RenderTemplateResult. Anything else
 * throws OnlyResponseCanBeReturned. Through App.render(), this surfaces as a 500.
 *
 * Migrated from the integration test in test/astro-not-response.test.ts.
 */

describe('Not returning responses', () => {
	it('produces a 500 when a page returns a non-Response value', async () => {
		const nullPage = createComponent(() => {
			return null as any;
		});
		const app = createTestApp([createPage(nullPage, { route: '/not-response' })]);
		const request = new Request('http://example.com/not-response');
		const response = await app.render(request);

		assert.equal(response.status, 500);
	});
});
