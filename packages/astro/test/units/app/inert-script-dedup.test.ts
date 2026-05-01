import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import { createRenderInstruction } from '../../../dist/runtime/server/render/instruction.js';
import {
	createComponent,
	render,
	templateEnter,
	templateExit,
} from '../../../dist/runtime/server/index.js';
import { createManifest, createRouteInfo } from './test-helpers.ts';

const hydrationRouteData = {
	route: '/inert-hydration',
	component: 'src/pages/inert-hydration.astro',
	params: [],
	pathname: '/inert-hydration',
	distURL: [],
	pattern: /^\/inert-hydration\/?$/,
	segments: [[{ content: 'inert-hydration', dynamic: false, spread: false }]],
	type: 'page' as const,
	prerender: false,
	fallbackRoutes: [],
	isIndex: false,
	origin: 'project' as const,
};

const serverIslandRouteData = {
	route: '/inert-server-island-runtime',
	component: 'src/pages/inert-server-island-runtime.astro',
	params: [],
	pathname: '/inert-server-island-runtime',
	distURL: [],
	pattern: /^\/inert-server-island-runtime\/?$/,
	segments: [[{ content: 'inert-server-island-runtime', dynamic: false, spread: false }]],
	type: 'page' as const,
	prerender: false,
	fallbackRoutes: [],
	isIndex: false,
	origin: 'project' as const,
};

const hydrationInstruction = createRenderInstruction({
	type: 'directive',
	hydration: {
		directive: 'load',
		value: '',
		componentUrl: '',
		componentExport: { value: '' },
	},
});

const serverIslandInstruction = createRenderInstruction({ type: 'server-island-runtime' });

const hydrationPage = createComponent((result: any) => {
	return render`
		<template id="inert-hydration-template">
			${templateEnter(result)}
			${hydrationInstruction}
			${templateExit(result)}
		</template>
		<div id="hydration-runtime">${hydrationInstruction}</div>
	`;
});

const serverIslandPage = createComponent((result: any) => {
	return render`
		<template id="inert-server-island-template">
			${templateEnter(result)}
			${serverIslandInstruction}
			${templateExit(result)}
		</template>
		<div id="server-island-runtime">${serverIslandInstruction}</div>
	`;
});

const pageMap = new Map([
	[
		hydrationRouteData.component,
		async () => ({
			page: async () => ({
				default: hydrationPage,
			}),
		}),
	],
	[
		serverIslandRouteData.component,
		async () => ({
			page: async () => ({
				default: serverIslandPage,
			}),
		}),
	],
]);

const app = new App(
	createManifest({
		routes: [createRouteInfo(hydrationRouteData), createRouteInfo(serverIslandRouteData)],
		clientDirectives: new Map([['load', 'console.log("directive")']]),
		pageMap: pageMap as any,
	}) as any,
);

describe('Inert template script deduplication', () => {
	it('keeps hydration prescripts available after template content', async () => {
		const response = await app.render(new Request('http://example.com/inert-hydration'));
		const html = await response.text();

		assert.equal(countOccurrences(html, 'console.log("directive")'), 2);
	});

	it('does not consume server-island runtime dedup inside template content', async () => {
		const response = await app.render(
			new Request('http://example.com/inert-server-island-runtime'),
		);
		const html = await response.text();

		assert.equal(countOccurrences(html, 'replaceServerIsland('), 2);
	});
});

function countOccurrences(content: string, needle: string) {
	return content.split(needle).length - 1;
}
