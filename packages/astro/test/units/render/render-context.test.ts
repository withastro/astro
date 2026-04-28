import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RenderContext } from '../../../dist/core/render-context.js';
import { createComponent, maybeRenderHead, render } from '../../../dist/runtime/server/index.js';
import type { AstroComponentFactory } from '../../../dist/runtime/server/render/index.js';
import { createBasicPipeline, SpyLogger } from '../test-utils.ts';
import { createMockRenderContext } from '../mocks.ts';

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

	describe('context.logger (APIContext)', () => {
		it('warns when context.logger is accessed without experimentalLogger enabled', async () => {
			const spyLogger = new SpyLogger();
			const renderContext = await createMockRenderContext({ logger: spyLogger });

			renderContext.createActionAPIContext().logger;

			assert.equal(spyLogger.writeCount(), 1);
			assert.equal(spyLogger.logs[0].level, 'warn');
			assert.match(spyLogger.logs[0].message, /experimental\.logger/i);
		});

		it('provides info/warn/error methods when experimentalLogger is enabled', async () => {
			const spyLogger = new SpyLogger();
			const renderContext = await createMockRenderContext({
				logger: spyLogger,
				manifest: {
					experimentalLogger: {
						entrypoint: 'astro/logger/node',
					},
				},
			});

			const { logger } = renderContext.createActionAPIContext();
			assert.ok(logger);
			assert.equal(typeof logger.info, 'function');
			assert.equal(typeof logger.warn, 'function');
			assert.equal(typeof logger.error, 'function');
		});

		it('context.logger delegates to the pipeline logger', async () => {
			const spyLogger = new SpyLogger();
			const renderContext = await createMockRenderContext({
				logger: spyLogger,
				manifest: {
					experimentalLogger: {
						entrypoint: 'astro/logger/node',
					},
				},
			});

			const ctx = renderContext.createActionAPIContext();
			ctx.logger!.info('info message');
			ctx.logger!.warn('warn message');
			ctx.logger!.error('error message');

			assert.equal(spyLogger.writeCount(), 3);
			assert.deepStrictEqual(spyLogger.logs, [
				{ level: 'info', label: null, message: 'info message' },
				{ level: 'warn', label: null, message: 'warn message' },
				{ level: 'error', label: null, message: 'error message' },
			]);
		});
	});

	describe('Astro.logger (page rendering)', () => {
		it('Astro.logger is always available on the page global', async () => {
			const spyLogger = new SpyLogger();
			const renderContext = await createMockRenderContext({ logger: spyLogger });

			const LoggingPage = createComponent((result: any, _props: any, _slots: any) => {
				const Astro = result.createAstro({}, null);
				Astro.logger.info('page info');
				Astro.logger.warn('page warn');
				Astro.logger.error('page error');
				return render`<html><head>${maybeRenderHead()}</head><body><p>Logged</p></body></html>`;
			});

			const response = await renderContext.render(createAstroModule(LoggingPage));
			assert.equal(response.status, 200);

			const userLogs = spyLogger.logs.filter((l) => l.label === null);
			assert.equal(userLogs.length, 3);
			assert.deepStrictEqual(userLogs, [
				{ level: 'info', label: null, message: 'page info' },
				{ level: 'warn', label: null, message: 'page warn' },
				{ level: 'error', label: null, message: 'page error' },
			]);
		});

		it('Astro.logger delegates to the pipeline logger', async () => {
			const spyLogger = new SpyLogger();
			const renderContext = await createMockRenderContext({
				logger: spyLogger,
				manifest: {
					experimentalLogger: {
						entrypoint: 'astro/logger/node',
					},
				},
			});

			const LoggingPage = createComponent((result: any, _props: any, _slots: any) => {
				const Astro = result.createAstro({}, null);
				Astro.logger.info('hello from page');
				return render`<html><head>${maybeRenderHead()}</head><body><p>OK</p></body></html>`;
			});

			const response = await renderContext.render(createAstroModule(LoggingPage));
			assert.equal(response.status, 200);

			const userLogs = spyLogger.logs.filter((l) => l.label === null);
			assert.equal(userLogs.length, 1);
			assert.equal(userLogs[0].level, 'info');
			assert.equal(userLogs[0].message, 'hello from page');
		});
	});
});
