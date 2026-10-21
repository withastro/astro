import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import type { AstroComponentFactory } from '../../../dist/runtime/server/render/index.js';
import { createTestApp, createPage } from '../mocks.ts';

async function renderAndCapture(
	page: AstroComponentFactory,
	manifestOverrides: Record<string, unknown> = {},
) {
	const app = createTestApp(
		[createPage(page, { route: '/test', prerender: false })],
		manifestOverrides,
	);
	const response = await app.render(new Request('http://example.com/test'));
	return response;
}

describe('Astro.session getter', () => {
	it('returns undefined when no session driver is configured', async () => {
		let sessionValue: unknown = 'not-called';
		const page = createComponent((result: any, props: any, slots: any) => {
			const Astro = result.createAstro(props, slots);
			sessionValue = Astro.session;
			return render`<p>done</p>`;
		});

		await renderAndCapture(page);

		assert.equal(sessionValue, undefined);
	});
});

describe('Astro.csp getter', () => {
	it('returns undefined when CSP is not configured in the manifest', async () => {
		let cspValue: unknown = 'not-called';
		const page = createComponent((result: any, props: any, slots: any) => {
			const Astro = result.createAstro(props, slots);
			cspValue = Astro.csp;
			return render`<p>done</p>`;
		});

		await renderAndCapture(page);

		assert.equal(cspValue, undefined);
	});

	it('returns an object with insert* methods when CSP is configured', async () => {
		let cspValue: Record<string, unknown> | undefined;
		const page = createComponent((result: any, props: any, slots: any) => {
			const Astro = result.createAstro(props, slots);
			cspValue = Astro.csp;
			return render`<p>done</p>`;
		});

		await renderAndCapture(page, {
			csp: {
				algorithm: 'SHA-256',
				cspDestination: 'header',
				scriptHashes: [],
				styleHashes: [],
				scriptResources: [],
				styleResources: [],
				directives: [],
				isStrictDynamic: false,
			},
		});

		assert.ok(cspValue !== undefined, 'expected csp object when CSP is configured');
		assert.equal(typeof cspValue.insertScriptHash, 'function');
		assert.equal(typeof cspValue.insertStyleHash, 'function');
		assert.equal(typeof cspValue.insertScriptResource, 'function');
		assert.equal(typeof cspValue.insertStyleResource, 'function');
		assert.equal(typeof cspValue.insertDirective, 'function');
	});
});
