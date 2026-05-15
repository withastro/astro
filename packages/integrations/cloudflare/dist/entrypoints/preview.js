import { existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { preview } from 'vite';
import { fileURLToPath } from 'node:url';
import { cloudflare as cfVitePlugin } from '@cloudflare/vite-plugin';
import colors from 'piccolore';
import { performance } from 'node:perf_hooks';
const createPreviewServer = async ({
	logger,
	base,
	server,
	headers,
	port,
	host,
	allowedHosts,
	root,
}) => {
	const wranglerConfigPath = resolvePath(fileURLToPath(root), '.wrangler/deploy/config.json');
	if (!existsSync(wranglerConfigPath)) {
		logger.error('No build output found. Run `astro build` before running `astro preview`.');
		process.exit(1);
	}
	const startServerTime = performance.now();
	let previewServer;
	try {
		previewServer = await preview({
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
				allowedHosts,
			},
			plugins: [
				cfVitePlugin({ ...globalThis.astroCloudflareOptions, viteEnvironment: { name: 'ssr' } }),
			],
		});
	} catch (err) {
		if (err instanceof Error) {
			logger.error(err.stack || err.message);
		}
		throw err;
	}
	const customShortcuts = [
		// Disable default Vite shortcuts that don't work well with Astro
		{ key: 'r', description: '' },
		{ key: 'u', description: '' },
		{ key: 'c', description: '' },
		{ key: 's', description: '' },
	];
	previewServer.bindCLIShortcuts({
		customShortcuts,
	});
	logger.info(
		serverStart({
			startupTime: performance.now() - startServerTime,
			resolvedUrls: previewServer.resolvedUrls ?? { local: [], network: [] },
			host,
			base,
		}),
	);
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
};
function serverStart({ startupTime, resolvedUrls, host, base }) {
	const version = '13.5.1';
	const localPrefix = `${colors.dim('\u2503')} Local    `;
	const networkPrefix = `${colors.dim('\u2503')} Network  `;
	const emptyPrefix = ' '.repeat(11);
	const localUrlMessages = resolvedUrls.local.map((url, i) => {
		return `${i === 0 ? localPrefix : emptyPrefix}${colors.cyan(new URL(url).origin + base)}`;
	});
	const networkUrlMessages = resolvedUrls.network.map((url, i) => {
		return `${i === 0 ? networkPrefix : emptyPrefix}${colors.cyan(new URL(url).origin + base)}`;
	});
	if (networkUrlMessages.length === 0) {
		const networkLogging = getNetworkLogging(host);
		if (networkLogging === 'host-to-expose') {
			networkUrlMessages.push(`${networkPrefix}${colors.dim('use --host to expose')}`);
		} else if (networkLogging === 'visible') {
			networkUrlMessages.push(`${networkPrefix}${colors.dim('unable to find network to expose')}`);
		}
	}
	const messages = [
		'',
		`${colors.bgGreen(colors.bold(` astro `))} ${colors.green(`v${version}`)} ${colors.dim(`ready in`)} ${Math.round(
			startupTime,
		)} ${colors.dim('ms')}`,
		'',
		...localUrlMessages,
		...networkUrlMessages,
		'',
	];
	return messages.filter((msg) => typeof msg === 'string').join('\n');
}
const LOCAL_IP_HOSTS = /* @__PURE__ */ new Set(['localhost', '127.0.0.1']);
function getNetworkLogging(host) {
	if (!host) {
		return 'host-to-expose';
	} else if (typeof host === 'string' && LOCAL_IP_HOSTS.has(host)) {
		return 'none';
	} else {
		return 'visible';
	}
}
export { createPreviewServer as default, serverStart };
