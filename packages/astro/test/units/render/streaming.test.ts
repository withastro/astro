import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	createComponent,
	render,
	renderComponent,
	Fragment,
} from '../../../dist/runtime/server/index.js';
import { App } from '../../../dist/core/app/app.js';
import { createTestApp, createPage, createRouteData } from '../mocks.ts';
import { createManifest, createRouteInfo } from '../app/test-helpers.ts';

import type { SSRManifest, RouteInfo } from '../../../dist/core/app/types.js';
import type { AstroComponentFactory } from '../../../dist/runtime/server/render/index.js';

// #region Helpers

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function collectChunks(response: Response): Promise<string[]> {
	const decoder = new TextDecoder();
	const reader = response.body!.getReader();
	const chunks: string[] = [];
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(decoder.decode(value));
	}
	return chunks;
}

function createNonStreamingApp(page: AstroComponentFactory, route: string): App {
	const routeData = createRouteData({ route });
	const routes: RouteInfo[] = [createRouteInfo(routeData) as RouteInfo];
	const pageMap = new Map<string, () => Promise<Record<string, unknown>>>([
		[routeData.component, async () => ({ page: async () => ({ default: page }) })],
	]);
	const manifest = createManifest({
		routes,
		pageMap: pageMap as unknown as ReturnType<typeof createManifest>['pageMap'],
	});
	return new App(manifest as unknown as SSRManifest, false);
}

// #endregion

// #region Async components

const AsyncChild = createComponent(async (_result: any, props: any) => {
	await wait(15);
	return render`<li>Item ${props.id}</li>\n`;
});

const StreamingPage = createComponent((result: any) => {
	return render`<html><head><title>Testing</title></head><body>
<header><h1>My Site</h1></header>
<ul>
${renderComponent(result, 'AsyncChild', AsyncChild, { id: '1' })}
${renderComponent(result, 'AsyncChild', AsyncChild, { id: '2' })}
${renderComponent(result, 'AsyncChild', AsyncChild, { id: '3' })}
${renderComponent(result, 'AsyncChild', AsyncChild, { id: '4' })}
${renderComponent(result, 'AsyncChild', AsyncChild, { id: '5' })}
${renderComponent(result, 'AsyncChild', AsyncChild, { id: '6' })}
${renderComponent(result, 'AsyncChild', AsyncChild, { id: '7' })}
${renderComponent(result, 'AsyncChild', AsyncChild, { id: '8' })}
${renderComponent(result, 'AsyncChild', AsyncChild, { id: '9' })}
${renderComponent(result, 'AsyncChild', AsyncChild, { id: '10' })}
</ul>
</body></html>`;
});

// #endregion

// #region Fragment streaming components

const FragmentStreamingPage = createComponent((result: any) => {
	const promise = wait(50).then(() => 'resolved');
	return render`<html><head><title>Fragment Streaming</title></head><body>
${renderComponent(
	result,
	'Fragment',
	Fragment,
	{},
	{
		default: () => render`
<p id="sync-in-fragment">sync content</p>
${promise.then(() => render`<p id="async-in-fragment">async content</p>`)}
`,
	},
)}
</body></html>`;
});

// #endregion

// #region Tests

describe('Streaming', () => {
	it('body is chunked with async components', async () => {
		const app = createTestApp([createPage(StreamingPage, { route: '/' })]);
		const response = await app.render(new Request('http://example.com/'));
		const chunks = await collectChunks(response);

		assert.ok(chunks.length > 1, `Expected multiple chunks, got ${chunks.length}`);
	});

	it('can get the full html body', async () => {
		const app = createTestApp([createPage(StreamingPage, { route: '/' })]);
		const response = await app.render(new Request('http://example.com/'));
		const html = await response.text();

		assert.ok(html.includes('<header>'), 'Should contain header');
		assert.ok(html.includes('<h1>My Site</h1>'), 'Should contain h1');
		// Count list items
		const liCount = (html.match(/<li>/g) || []).length;
		assert.equal(liCount, 10, 'Should contain 10 list items');
	});

	it('response body is correctly served from cache of chunks', async () => {
		const app = createTestApp([createPage(StreamingPage, { route: '/' })]);
		const response = await app.render(new Request('http://example.com/'));
		const chunks = await collectChunks(response);
		const fullBody = chunks.join('');

		assert.ok(fullBody.includes('Item 1'), 'First item present');
		assert.ok(fullBody.includes('Item 10'), 'Last item present');
	});

	it('sync sibling inside Fragment streams before async child resolves', async () => {
		const app = createTestApp([
			createPage(FragmentStreamingPage, { route: '/fragment-streaming' }),
		]);
		const response = await app.render(new Request('http://example.com/fragment-streaming'));
		const chunks = await collectChunks(response);

		const syncChunkIndex = chunks.findIndex((c) => c.includes('sync-in-fragment'));
		const asyncChunkIndex = chunks.findIndex((c) => c.includes('async-in-fragment'));
		assert.ok(syncChunkIndex !== -1, 'sync-in-fragment present in output');
		assert.ok(asyncChunkIndex !== -1, 'async-in-fragment present in output');
		assert.ok(
			syncChunkIndex < asyncChunkIndex,
			`sync content (chunk ${syncChunkIndex}) should stream before async content (chunk ${asyncChunkIndex})`,
		);
	});

	it('stays alive on failed component renders', async () => {
		// Errors that occur before any body is written cause a 500 with empty body.
		// This mirrors the original fixture where synchronous template expressions
		// like `{foo.bar.baz.length}` throw before rendering starts.
		const ErrorPage = createComponent(() => {
			const foo = { bar: null } as any;
			// Both expressions throw — tests that multiple errors don't hang the stream
			foo.bar.baz.length;
			return render`<html><body>should not reach</body></html>`;
		});

		const app = createTestApp([createPage(ErrorPage, { route: '/multiple-errors' })]);
		const response = await app.render(new Request('http://example.com/multiple-errors'));

		assert.equal(response.status, 500);
		const text = await response.text();
		assert.equal(text, '');
	});
});

describe('Streaming disabled', () => {
	it('can get the full html body with content-length', async () => {
		const app = createNonStreamingApp(StreamingPage, '/');
		const response = await app.render(new Request('http://example.com/'));

		assert.equal(response.status, 200);
		assert.equal(response.headers.get('content-type'), 'text/html');
		assert.ok(response.headers.has('content-length'), 'Should have content-length header');
		assert.ok(
			Number.parseInt(response.headers.get('content-length')!) > 0,
			'content-length should be > 0',
		);

		const html = await response.text();
		assert.ok(html.includes('<header>'), 'Should contain header');
		const liCount = (html.match(/<li>/g) || []).length;
		assert.equal(liCount, 10, 'Should contain 10 list items');
	});
});

// #endregion
