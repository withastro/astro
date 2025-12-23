import type { CreatePreviewServer } from 'astro';
import {
	preview,
	type PreviewServer as VitePreviewServer,
	type CLIShortcut,
	type ResolvedServerUrls,
} from 'vite';
import { fileURLToPath } from 'node:url';
import { cloudflare as cfVitePlugin, type PluginConfig } from '@cloudflare/vite-plugin';
import type * as http from 'node:http';
import colors from 'piccolore';
import { performance } from 'node:perf_hooks';
import { cloudflareConfigCustomizer } from '../wrangler.js';

const createPreviewServer: CreatePreviewServer = async ({
	logger,
	base,
	server,
	headers,
	port,
	host,
	root,
}) => {
	const startServerTime = performance.now();
	let previewServer: VitePreviewServer;
	const cfPluginConfig: PluginConfig = {
		viteEnvironment: { name: 'ssr' },
		config: cloudflareConfigCustomizer(),
	};

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
				allowedHosts: [],
			},
			plugins: [cfVitePlugin(cfPluginConfig)],
		});
	} catch (err) {
		if (err instanceof Error) {
			logger.error(err.stack || err.message);
		}
		throw err;
	}

	// Set up shortcuts

	const customShortcuts: Array<CLIShortcut> = [
		// Disable default Vite shortcuts that don't work well with Astro
		{ key: 'r', description: '' },
		{ key: 'u', description: '' },
		{ key: 'c', description: '' },
		{ key: 's', description: '' },
	];

	previewServer.bindCLIShortcuts({
		customShortcuts,
	});

	// Log server start URLs
	logger.info(
		serverStart({
			startupTime: performance.now() - startServerTime,
			resolvedUrls: previewServer.resolvedUrls ?? { local: [], network: [] },
			host,
			base,
		}),
	);

	// Resolves once the server is closed
	function closed() {
		return new Promise<void>((resolve, reject) => {
			previewServer.httpServer.addListener('close', resolve);
			previewServer.httpServer.addListener('error', reject);
		});
	}

	return {
		host,
		port,
		closed,
		server: previewServer.httpServer as http.Server,
		stop: previewServer.close.bind(previewServer),
	};
};

/** Display server host and startup time */
export function serverStart({
	startupTime,
	resolvedUrls,
	host,
	base,
}: {
	startupTime: number;
	resolvedUrls: ResolvedServerUrls;
	host: string | undefined;
	base: string;
}): string {
	// PACKAGE_VERSION is injected at build-time
	const version = process.env.PACKAGE_VERSION ?? '0.0.0';
	const localPrefix = `${colors.dim('┃')} Local    `;
	const networkPrefix = `${colors.dim('┃')} Network  `;
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

const LOCAL_IP_HOSTS = new Set(['localhost', '127.0.0.1']);

function getNetworkLogging(host: string | undefined): 'none' | 'host-to-expose' | 'visible' {
	if (!host) {
		return 'host-to-expose';
	} else if (typeof host === 'string' && LOCAL_IP_HOSTS.has(host)) {
		return 'none';
	} else {
		return 'visible';
	}
}

export { createPreviewServer as default };
