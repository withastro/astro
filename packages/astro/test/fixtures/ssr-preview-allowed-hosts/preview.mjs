import { preview } from 'vite';
import { fileURLToPath } from 'node:url';

/**
 * A minimal adapter preview entrypoint that mirrors the Cloudflare adapter pattern:
 * it starts a Vite preview server and forwards `allowedHosts` from the Astro config.
 *
 * This lets us test that the core preview entrypoint actually passes `allowedHosts`
 * through to adapter preview modules.
 */
export default async function ({ host, port, headers, base, root, server, allowedHosts }) {
	const previewServer = await preview({
		configFile: false,
		base,
		appType: 'mpa',
		build: {
			outDir: fileURLToPath(server),
		},
		root: fileURLToPath(root),
		preview: {
			host,
			port,
			headers,
			open: false,
			allowedHosts: allowedHosts ?? [],
		},
	});

	function closed() {
		return new Promise((resolve, reject) => {
			previewServer.httpServer.addListener('close', resolve);
			previewServer.httpServer.addListener('error', reject);
		});
	}

	return {
		host,
		port,
		closed,
		server: previewServer.httpServer,
		stop: previewServer.close.bind(previewServer),
	};
}
