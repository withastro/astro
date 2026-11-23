import { createServer } from 'node:http';
import type { Socket } from 'node:net';
import type { CreatePreviewServer } from 'astro';

const preview: CreatePreviewServer = async function ({ serverEntrypoint, host, port }) {
	const ssrModule = await import(serverEntrypoint.toString());
	const ssrHandler = ssrModule.handler;
	const server = createServer(ssrHandler);
	server.listen(port, host);
	const connections = new Set<Socket>();
	server.on('connection', (socket) => {
		connections.add(socket);
		socket.once('close', () => connections.delete(socket));
	});

	// biome-ignore lint/suspicious/noConsole: allowed
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
				server.close((err) => (err ? reject(err) : resolve(undefined)));
				for (const socket of connections) socket.destroy();
			});
		},
	};
};

export { preview as default };
