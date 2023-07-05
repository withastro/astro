import type { EndpointHandler } from '../../../@types/astro';
import type { LogOptions } from '../../logger/core';
import type { SSROptions } from '../../render/dev';
import { createRenderContext } from '../../render/index.js';
import { callEndpoint } from '../index.js';

export async function call(options: SSROptions, logging: LogOptions) {
	const { env, preload, middleware } = options;
	const endpointHandler = preload as unknown as EndpointHandler;

	const ctx = await createRenderContext({
		request: options.request,
		origin: options.origin,
		pathname: options.pathname,
		route: options.route,
		env,
		mod: preload,
	});

	return await callEndpoint(endpointHandler, env, ctx, logging, middleware?.onRequest);
}
