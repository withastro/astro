import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { FetchState } from '../../../dist/core/fetch/fetch-state.js';
import {
	createComponent,
	createHeadAndContent,
	render,
	renderComponent,
	renderUniqueStylesheet,
	unescapeHTML,
} from '../../../dist/runtime/server/index.js';
import type { AstroComponentFactory } from '../../../dist/runtime/server/render/index.js';
import type { Pipeline } from '../../../dist/core/render/index.js';
import { AstroMiddleware } from '../../../dist/core/middleware/astro-middleware.js';
import { ActionHandler } from '../../../dist/actions/handler.js';
import { PagesHandler } from '../../../dist/core/pages/handler.js';
import { createBasicPipeline, SpyLogger } from '../test-utils.ts';

const createAstroModule = (AstroComponent: AstroComponentFactory, partial = false) => ({
	default: AstroComponent,
	partial,
});

async function renderPartialPage(
	pipeline: Pipeline,
	pagesHandler: PagesHandler,
	Component: AstroComponentFactory,
	{
		component = 'src/pages/partial.astro',
		partial = true,
	}: { component?: string; partial?: boolean } = {},
) {
	const request = new Request(`http://example.com/partial`);
	const routeData = {
		type: 'page',
		pathname: '/partial',
		component,
		params: {},
	};
	const state = new FetchState(pipeline, request);
	state.routeData = routeData as any;
	state.pathname = '/partial';
	state.componentInstance = createAstroModule(Component, partial) as any;
	state.slots = {};
	const middleware = new AstroMiddleware(pipeline);
	const actionHandler = new ActionHandler();
	return middleware.handle(state, (s, ctx) => {
		if (!s.skipMiddleware) {
			const actionResult = actionHandler.handle(ctx, s);
			if (actionResult) {
				return actionResult.then((r) => r ?? pagesHandler.handle(s, ctx));
			}
		}
		return pagesHandler.handle(s, ctx);
	});
}

describe('Partials warn about stripped component assets', () => {
	let logger: SpyLogger;
	let pipeline: Pipeline;
	let pagesHandler: PagesHandler;

	function freshPipeline() {
		logger = new SpyLogger({ level: 'warn' });
		pipeline = createBasicPipeline({ logger });
		pipeline.headElements = () => ({
			links: new Set(),
			scripts: new Set(),
			styles: new Set(),
		});
		pagesHandler = new PagesHandler(pipeline);
		return pipeline;
	}

	before(() => {
		freshPipeline();
	});

	function makePropagatingPartial(): AstroComponentFactory {
		const HeadEntry = createComponent({
			factory(result: any, _props: any, _slots: any) {
				const link = renderUniqueStylesheet(result, {
					type: 'external',
					src: '/some/fake/styles.css',
				});
				return createHeadAndContent(
					unescapeHTML(link) as unknown as string,
					render`<div id="other">Other</div>`,
				);
			},
			propagation: 'self',
		});

		return createComponent(
			(result: any) => render`<li>${renderComponent(result, 'HeadEntry', HeadEntry, {}, {})}</li>`,
		);
	}

	it('warns when a partial page contains components with scoped styles or scripts', async () => {
		freshPipeline();
		const Partial = makePropagatingPartial();
		await renderPartialPage(pipeline, pagesHandler, Partial);

		const warnings = logger.logs.filter((entry) => entry.level === 'warn');
		assert.equal(warnings.length, 1, 'expected exactly one warning');
		assert.match(warnings[0].message, /partial/);
		assert.match(warnings[0].message, /scoped styles/);
		assert.match(warnings[0].message, /src\/pages\/partial\.astro/);
	});

	it('does not warn when a partial page has no stripped assets', async () => {
		freshPipeline();
		const Partial = createComponent(() => render`<li>Plain partial</li>`);
		await renderPartialPage(pipeline, pagesHandler, Partial);

		const warnings = logger.logs.filter((entry) => entry.level === 'warn');
		assert.equal(warnings.length, 0);
	});

	it('does not warn when the page is not a partial', async () => {
		freshPipeline();
		const Page = makePropagatingPartial();
		await renderPartialPage(pipeline, pagesHandler, Page, {
			partial: false,
			component: 'src/pages/not-partial.astro',
		});

		const warnings = logger.logs.filter((entry) => entry.level === 'warn');
		assert.equal(warnings.length, 0);
	});

	it('warns only once per route component across repeated renders', async () => {
		freshPipeline();
		const Partial = makePropagatingPartial();
		await renderPartialPage(pipeline, pagesHandler, Partial);
		await renderPartialPage(pipeline, pagesHandler, Partial);
		await renderPartialPage(pipeline, pagesHandler, Partial);

		const warnings = logger.logs.filter((entry) => entry.level === 'warn');
		assert.equal(warnings.length, 1, 'expected dedupe across repeated renders');
	});
});
