import { fileURLToPath } from 'node:url';
import type { CreatePreviewServer } from 'astro';
import { AstroError } from 'astro/errors';
import { PREVIEW_KEY } from '../shared.js';
import type { CreateNodePreviewServer } from '../types.js';

interface MaybeServerModule {
	createNodePreviewServer?: CreateNodePreviewServer;
}

const createPreviewServer: CreatePreviewServer = async (preview) => {
	let createNodePreviewServer: CreateNodePreviewServer;
	try {
		process.env[PREVIEW_KEY] = 'true';
		const mod: MaybeServerModule = await import(preview.serverEntrypoint.toString());
		if (typeof mod.createNodePreviewServer === 'function') {
			createNodePreviewServer = mod.createNodePreviewServer;
		} else {
			throw new AstroError(
				`The server entrypoint doesn't export a createNodePreviewServer() function. Are you sure this is the right file?`,
			);
		}
	} catch (err) {
		if (
			(err as any).code === 'ERR_MODULE_NOT_FOUND' &&
			(err as any).url === preview.serverEntrypoint.href
		) {
			throw new AstroError(
				`The server entrypoint ${fileURLToPath(
					preview.serverEntrypoint,
				)} does not exist. Have you ran a build yet?`,
			);
		} else {
			throw err;
		}
	}
	// If the user didn't specify a host, it will already have been defaulted to
	// "localhost" by getResolvedHostForHttpServer in astro core/preview/util.ts.
	// The value `undefined` actually means that either the user set `options.server.host`
	// to `true`, or they passed `--host` without an argument. In that case, we
	// should listen on all IPs.
	const host = process.env.HOST ?? preview.host ?? '0.0.0.0';

	const port = preview.port ?? 4321;
	const nodePreviewServer = await createNodePreviewServer({
		host,
		port,
		headers: preview.headers,
		logger: preview.logger,
	});

	return {
		...nodePreviewServer,
		host,
		port,
	};
};

export default createPreviewServer;
