import type { EndpointHandler } from '../../../@types/astro';
import type { SSROptions } from '../../render/dev';

import { preload } from '../../render/dev/index.js';
import { errorHandler } from '../../render/dev/error.js';
import { call as callEndpoint } from '../index.js';
import { createRequest } from '../../render/request.js';


export async function call(ssrOpts: SSROptions) {
	try {
		const request = createRequest(ssrOpts.method, ssrOpts.pathname,
			ssrOpts.headers, ssrOpts.origin, ssrOpts.astroConfig.buildOptions.site, ssrOpts.astroConfig.buildOptions.experimentalSsr);
		const [, mod] = await preload(ssrOpts);
		return await callEndpoint(mod as unknown as EndpointHandler, {
			...ssrOpts,
			request
		});
	} catch (e: unknown) {
		await errorHandler(e, { viteServer: ssrOpts.viteServer, filePath: ssrOpts.filePath });
		throw e;
	}
}
