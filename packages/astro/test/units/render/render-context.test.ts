import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FetchState } from '../../../dist/core/app/fetch-state.js';
import { createComponent, maybeRenderHead, render } from '../../../dist/runtime/server/index.js';
import type { AstroComponentFactory } from '../../../dist/runtime/server/render/index.js';
import { createBasicPipeline, renderThroughMiddleware } from '../test-utils.ts';

const createAstroModule = (AstroComponent: AstroComponentFactory) => ({ default: AstroComponent });

describe('FetchState', () => {
	describe('skipMiddleware and form action handling', () => {
		it('does not auto-execute form actions when skipMiddleware is true', async () => {
			let actionWasCalled = false;

			const pipeline = createBasicPipeline({
				manifest: {
					rootDir: import.meta.url,
					serverLike: true,
					experimentalQueuedRendering: { enabled: true },
				},
			} as any);

			// Set up a mock action on the pipeline
			(pipeline as any).resolvedActions = {
				server: {
					testAction: async function () {
						actionWasCalled = true;
						return { data: 'should not be called', error: undefined };
					},
				},
			};

			const SimplePage = createComponent(() => {
				return render`<html><head>${maybeRenderHead()}</head><body><p>Error page</p></body></html>`;
			});
			const PageModule = createAstroModule(SimplePage);

			// POST request with _action param (simulates form action submission)
			const request = new Request('http://example.com/404?_action=testAction', {
				method: 'POST',
				body: new FormData(),
			});

			const routeData = {
				type: 'page',
				pathname: '/404',
				component: 'src/pages/404.astro',
				params: {},
				route: '/404',
				prerender: false,
			};

			// Create state with skipMiddleware=true (as happens during error recovery)
			const state = new FetchState(pipeline, request);
			state.routeData = routeData as any;
			state.pathname = '/404';
			state.status = 404;
			state.skipMiddleware = true;

			const response = await renderThroughMiddleware(state, PageModule);

			assert.equal(response.status, 404);
			assert.equal(
				actionWasCalled,
				false,
				'Form action should not be auto-executed when skipMiddleware is true',
			);
		});

		it('auto-executes form actions when skipMiddleware is false', async () => {
			let actionWasCalled = false;

			const pipeline = createBasicPipeline({
				manifest: {
					rootDir: import.meta.url,
					serverLike: true,
					experimentalQueuedRendering: { enabled: true },
				},
			} as any);

			// Set up a mock action on the pipeline
			(pipeline as any).resolvedActions = {
				server: {
					testAction: async function () {
						actionWasCalled = true;
						return { data: 'action result', error: undefined };
					},
				},
			};

			const SimplePage = createComponent(() => {
				return render`<html><head>${maybeRenderHead()}</head><body><p>Page</p></body></html>`;
			});
			const PageModule = createAstroModule(SimplePage);

			// POST request with _action param (simulates form action submission)
			const request = new Request('http://example.com/page?_action=testAction', {
				method: 'POST',
				body: new FormData(),
			});

			const routeData = {
				type: 'page',
				pathname: '/page',
				component: 'src/pages/page.astro',
				params: {},
				route: '/page',
				prerender: false,
			};

			// Create state with skipMiddleware=false (normal flow)
			const state = new FetchState(pipeline, request);
			state.routeData = routeData as any;
			state.pathname = '/page';
			state.skipMiddleware = false;

			const response = await renderThroughMiddleware(state, PageModule);

			assert.equal(response.status, 200);
			assert.equal(
				actionWasCalled,
				true,
				'Form action should be auto-executed when skipMiddleware is false',
			);
		});
	});
});
