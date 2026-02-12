import { App } from 'astro/app';
import { manifest } from 'virtual:astro:manifest';
import { setGetEnv } from 'astro/env/setup';
import * as options from 'virtual:astro-node:config';
import { createHandleRequestDeps, handleRequest } from '../handler.js';

setGetEnv((key) => process.env[key]);

export async function handle(request: Request, locals?: Partial<App.Locals>): Promise<Response> {
	const app = new App(manifest, !options.experimentalDisableStreaming);
	const { als, prerenderedErrorPageFetch } = createHandleRequestDeps(app, options);
	return handleRequest({ app, request, locals, next: undefined, als, prerenderedErrorPageFetch });
}
