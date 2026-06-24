import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { FetchState } from '../../../dist/core/fetch/fetch-state.js';
import {
	createComponent,
	render,
} from '../../../dist/runtime/server/index.js';
import type { AstroComponentFactory } from '../../../dist/runtime/server/render/index.js';
import type { Pipeline } from '../../../dist/core/render/index.js';
import { createBasicPipeline, renderThroughMiddleware } from '../test-utils.ts';

const createAstroModule = (AstroComponent: AstroComponentFactory) => ({ default: AstroComponent });

describe('head content flush fallback', () => {
	let pipeline: Pipeline;
	before(async () => {
		pipeline = createBasicPipeline();
		pipeline.headElements = () => ({
			links: new Set(),
			scripts: new Set([
				{ name: 'script', props: { type: 'module', src: '/@vite/client' }, children: '' },
			]),
			styles: new Set(),
		});
	});

	it('flushes head scripts for pages without maybeRenderHead', async () => {
		// Simulates a simple page with no component imports — the compiler
		// does not emit maybeRenderHead() in this case.
		const Page = createComponent((_result: any) => {
			return render`<p>Simple page</p>`;
		});

		const PageModule = createAstroModule(Page);
		const request = new Request('http://example.com/');
		const routeData = {
			type: 'page',
			pathname: '/index',
			component: 'src/pages/index.astro',
			params: {},
		};
		const state = new FetchState(pipeline, request);
		state.routeData = routeData as any;
		state.pathname = '/index';
		const response = await renderThroughMiddleware(state, PageModule);

		const html = await response.text();
		assert.ok(
			html.includes('/@vite/client'),
			`Expected head scripts to be flushed, but got: ${html}`,
		);
	});
});
