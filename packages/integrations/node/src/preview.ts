import type { CreatePreviewServer } from 'astro';
import type http from 'node:http';
import { fileURLToPath } from 'node:url';
import { getNetworkAddress } from './get-network-address.js';
import { createServer } from './http-server.js';
import type { createExports } from './server';
import { AstroError } from 'astro/errors';

const preview: CreatePreviewServer = async function ({
	client,
	serverEntrypoint,
	host,
	port,
	base,
	logger,
}) {
	type ServerModule = ReturnType<typeof createExports>;
	type MaybeServerModule = Partial<ServerModule>;
	let ssrHandler: ServerModule['handler'];
	try {
		process.env.ASTRO_NODE_AUTOSTART = 'disabled';
		const ssrModule: MaybeServerModule = await import(serverEntrypoint.toString());
		if (typeof ssrModule.handler === 'function') {
			ssrHandler = ssrModule.handler;
		} else {
			throw new AstroError(
				`The server entrypoint doesn't have a handler. Are you sure this is the right file?`
			);
		}
	} catch (err) {
		if ((err as any).code === 'ERR_MODULE_NOT_FOUND') {
			throw new AstroError(
				`The server entrypoint ${fileURLToPath(
					serverEntrypoint
				)} does not exist. Have you ran a build yet?`
			);
		} else {
			throw err;
		}
	}

	const handler: http.RequestListener = (req, res) => {
		ssrHandler(req, res);
	};

	const baseWithoutTrailingSlash: string = base.endsWith('/')
		? base.slice(0, base.length - 1)
		: base;
	function removeBase(pathname: string): string {
		if (pathname.startsWith(base)) {
			return pathname.slice(baseWithoutTrailingSlash.length);
		}
		return pathname;
	}

	const server = createServer(
		{
			client,
			port,
			host,
			removeBase,
		},
		handler
	);
	const address = getNetworkAddress('http', host, port);

	if (host === undefined) {
		logger.info(
			`Preview server listening on \n  local: ${address.local[0]} \t\n  network: ${address.network[0]}\n`
		);
	} else {
		logger.info(`Preview server listening on ${address.local[0]}`);
	}

	return server;
};

export { preview as default };
