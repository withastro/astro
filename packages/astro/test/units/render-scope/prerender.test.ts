import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { renderForPrerender, type PrerenderableApp } from '../../../dist/core/app/prerender.js';
import { uninstallRenderScope } from '../../../dist/core/render-scope/scope.js';
import { ensureAsyncRenderScope } from '../../../dist/core/render-scope/node-scope.js';
import {
	recordContentEntryRender,
	recordStaticImage,
} from '../../../dist/core/render-scope/record.js';
import type { SerializedStaticImage } from '../../../dist/assets/types.js';
import { defaultLogger } from '../test-utils.ts';

function image(hash: string): SerializedStaticImage {
	return {
		originalPath: '/_astro/penguin.png',
		hash,
		finalPath: `/_astro/penguin.${hash}.webp`,
		originalSrcPath: 'src/assets/penguin.png',
		transform: { src: '/_astro/penguin.png' },
	};
}

function appOf(render: PrerenderableApp['render']): PrerenderableApp {
	return { logger: defaultLogger, render };
}

const request = () => new Request('https://example.com/page/');

describe('renderForPrerender', () => {
	afterEach(() => {
		uninstallRenderScope();
	});

	it('short-circuits when not collecting: metadata undefined, response unbuffered', async () => {
		ensureAsyncRenderScope();
		const appResponse = new Response('<html></html>');
		const app = appOf(async () => appResponse);
		const result = await renderForPrerender(app, request());
		assert.equal(result.metadata, undefined);
		// The response object is the app's own — no buffering, no reconstruction.
		assert.equal(result.response, appResponse);
		assert.equal(result.response.bodyUsed, false);
	});

	it('captures records fired during body pull (the scope spans buffering)', async () => {
		ensureAsyncRenderScope();
		const app = appOf(async () => {
			recordContentEntryRender('at-render');
			const stream = new ReadableStream({
				pull(controller) {
					// Lazily-driven rendering work records while the body is consumed.
					recordContentEntryRender('during-body-pull');
					recordStaticImage(image('during-body-pull'));
					controller.enqueue(new TextEncoder().encode('<html>streamed</html>'));
					controller.close();
				},
			});
			return new Response(stream, { status: 200, headers: { 'X-Test': 'yes' } });
		});
		const { response, metadata } = await renderForPrerender(app, request(), {
			collectMetadata: true,
		});
		assert.deepEqual(metadata?.contentEntryKeys, ['at-render', 'during-body-pull']);
		assert.deepEqual(
			metadata?.staticImages?.map((img) => img.hash),
			['during-body-pull'],
		);
		assert.equal(response.status, 200);
		assert.equal(response.headers.get('X-Test'), 'yes');
		assert.equal(await response.text(), '<html>streamed</html>');
	});

	it('preserves body-nullness for null-body responses', async () => {
		ensureAsyncRenderScope();
		const app = appOf(async () => new Response(null, { status: 204, statusText: 'No Content' }));
		const { response, metadata } = await renderForPrerender(app, request(), {
			collectMetadata: true,
		});
		assert.equal(response.body, null);
		assert.equal(response.status, 204);
		assert.equal(response.statusText, 'No Content');
		assert.deepEqual(metadata, { contentEntryKeys: [], staticImages: [] });
	});

	it('round-trips a redirect response with status, headers, and null body', async () => {
		ensureAsyncRenderScope();
		const app = appOf(
			async () => new Response(null, { status: 302, headers: { Location: '/elsewhere/' } }),
		);
		const { response } = await renderForPrerender(app, request(), { collectMetadata: true });
		assert.equal(response.status, 302);
		assert.equal(response.headers.get('Location'), '/elsewhere/');
		assert.equal(response.body, null);
	});

	it('propagates a throwing render; the next render collects cleanly', async () => {
		ensureAsyncRenderScope();
		const failing = appOf(async () => {
			recordContentEntryRender('doomed');
			throw new Error('boom');
		});
		await assert.rejects(renderForPrerender(failing, request(), { collectMetadata: true }), /boom/);

		const app = appOf(async () => {
			recordContentEntryRender('clean');
			return new Response('ok');
		});
		const { metadata } = await renderForPrerender(app, request(), { collectMetadata: true });
		assert.deepEqual(metadata?.contentEntryKeys, ['clean']);
	});

	it('degrades to metadata undefined when collecting without an installed scope', async () => {
		const app = appOf(async () => new Response('ok'));
		const { response, metadata } = await renderForPrerender(app, request(), {
			collectMetadata: true,
		});
		assert.equal(metadata, undefined);
		assert.equal(await response.text(), 'ok');
	});

	it('forwards routeData to the app', async () => {
		const routeData = { component: 'src/pages/index.astro' } as any;
		let received: unknown;
		const app = appOf(async (_request, opts) => {
			received = opts.routeData;
			return new Response('ok');
		});
		await renderForPrerender(app, request(), { routeData });
		assert.equal(received, routeData);
	});
});
