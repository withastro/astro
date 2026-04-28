import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RenderContext } from '../../../dist/core/render-context.js';
import { createComponent, maybeRenderHead, render } from '../../../dist/runtime/server/index.js';
import type { AstroComponentFactory } from '../../../dist/runtime/server/render/index.js';
import { createBasicPipeline } from '../test-utils.ts';

const createAstroModule = (AstroComponent: AstroComponentFactory) => ({ default: AstroComponent });

describe('RenderContext', () => {
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

			// Create context with skipMiddleware=true (as happens during error recovery)
			const renderContext = await RenderContext.create({
				pipeline,
				request,
				routeData,
				status: 404,
				skipMiddleware: true,
			} as any);

			const response = await renderContext.render(PageModule);

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

			// Create context with skipMiddleware=false (normal flow)
			const renderContext = await RenderContext.create({
				pipeline,
				request,
				routeData,
				skipMiddleware: false,
			} as any);

			const response = await renderContext.render(PageModule);

			assert.equal(response.status, 200);
			assert.equal(
				actionWasCalled,
				true,
				'Form action should be auto-executed when skipMiddleware is false',
			);
		});
	});
});
