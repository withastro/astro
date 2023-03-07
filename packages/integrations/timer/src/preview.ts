import type { CreatePreviewServer } from 'astro';
import { createServer } from 'http';
import enableDestroy from 'server-destroy';

const preview: CreatePreviewServer = async function ({ serverEntrypoint, host, port }) {
	const ssrModule = await import(serverEntrypoint.toString());
	const ssrHandler = ssrModule.handler;
	const server = createServer(ssrHandler);
	server.listen(port, host);
	enableDestroy(server);

	// eslint-disable-next-line no-console
	console.log(`Preview server listening on http://${host}:${port}`);

	// Resolves once the server is closed
	const closed = new Promise<void>((resolve, reject) => {
		server.addListener('close', resolve);
		server.addListener('error', reject);
	});

	return {
		host,
		port,
		closed() {
			return closed;
		},
		server,
		stop: async () => {
			await new Promise((resolve, reject) => {
				server.destroy((err) => (err ? reject(err) : resolve(undefined)));
			});
		},
	};
};

export { preview as default };
