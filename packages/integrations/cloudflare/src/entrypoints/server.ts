import type { ExecutionContext, ExportedHandlerFetchHandler } from '@cloudflare/workers-types';
import type { SSRManifest } from 'astro';

import { App } from 'astro/app';
import { handle } from '../utils/handler.js';

type Env = {
	[key: string]: unknown;
	ASSETS: { fetch: (req: Request | string) => Promise<Response> };
	ASTRO_STUDIO_APP_TOKEN?: string;
};

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);

	const fetch = async (
		request: Parameters<ExportedHandlerFetchHandler>[0],
		env: Env,
		context: ExecutionContext,
	) => {
		return await handle(manifest, app, request, env, context);
	};

	return { default: { fetch } };
}
