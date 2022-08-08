import { openConfig } from "../config.js";
import { nodeLogDestination } from "../logger/node.js";
import { createResult } from '../render/result.js';
import { AstroConfig } from "../../@types/astro.js";
import { renderJSX } from "../../runtime/server/jsx.js";
import { parseHTML } from 'linkedom';

const logging = {
	dest: nodeLogDestination,
	level: 'error',
} as const;
let config: AstroConfig;
async function getResult() {
	if (!config) {
		const { astroConfig } = await openConfig({ cmd: 'dev', logging });
		config = astroConfig;
	}
	const result = createResult({
		adapterName: undefined,
		origin: '',
		ssr: false,
		streaming: false,
		logging,
		markdown: config.markdown,
		mode: 'development',
		params: {},
		pathname: '/',
		props: {},
		renderers: [], 
		async resolve(s): Promise<string> {
			return s
		},
		site: 'http://example.com',
		request: new Request('http://example.com'),
		status: 200,
	})
	return result;
}

export async function render(vnode: any) {
	const result = await getResult();
	const html = await renderJSX(result, vnode);
	const { document } = parseHTML(`<template id="container">${html}</template>`);
	
	const container = document.querySelector('#container');
	return { container }
}
