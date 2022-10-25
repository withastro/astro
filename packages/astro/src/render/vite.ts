// @ts-expect-error
import userEnv from 'virtual:astro/user-config';
import {
	createBasicEnvironment,
	createRenderContext,
	renderPage as runtimeRenderPage,
} from '../core/render/index.js';
import { nodeLogDestination } from '../core/logger/node.js';

export async function renderPage(Component: any, { request = new Request('http://localhost:3000/'), ...props }: any) {
	const env = createBasicEnvironment({
		logging: { level: 'error', dest: nodeLogDestination },
	});
	const ctx = createRenderContext({ request, props });

	const response = await runtimeRenderPage({ default: Component } as any, ctx, env);
	return response.text();
}

export async function render(Component: any, { request = new Request('http://localhost:3000/'), ...props }: any) {
	const env = createBasicEnvironment({
		logging: { level: 'error', dest: nodeLogDestination },
		renderers: userEnv.renderers,
	});
	const ctx = createRenderContext({ request, props });

	const response = await runtimeRenderComponent(Component, ctx, env);
	return response;
}
