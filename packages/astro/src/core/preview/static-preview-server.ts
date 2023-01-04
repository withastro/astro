import type { AstroSettings } from '../../@types/astro';
import type { LogOptions } from '../logger/core';
import http, { OutgoingHttpHeaders } from 'http';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import { preview, type PreviewServer as VitePreviewServer } from 'vite';
import { error, info } from '../logger/core.js';
import * as msg from '../messages.js';
import { vitePluginAstroPreview } from './vite-plugin-astro-preview.js';

export interface PreviewServer {
	host?: string;
	port: number;
	server: http.Server;
	closed(): Promise<void>;
	stop(): Promise<void>;
}

export default async function createStaticPreviewServer(
	settings: AstroSettings,
	{
		logging,
		host,
	}: {
		logging: LogOptions;
		host: string | undefined;
	}
): Promise<PreviewServer> {
	const startServerTime = performance.now();

	let previewServer: VitePreviewServer;
	try {
		previewServer = await preview({
			configFile: false,
			base: settings.config.base,
			appType: 'mpa',
			build: {
				outDir: fileURLToPath(settings.config.outDir),
			},
			preview: {
				host,
				port: settings.config.server.port,
				headers: settings.config.server.headers,
			},
			plugins: [vitePluginAstroPreview(settings)],
		});
	} catch (err) {
		if (err instanceof Error) {
			error(logging, 'astro', err.stack || err.message);
		}
		throw err;
	}

	// Log server start URLs
	const site = settings.config.site
		? new URL(settings.config.base, settings.config.site)
		: undefined;
	info(
		logging,
		null,
		msg.serverStart({
			startupTime: performance.now() - startServerTime,
			resolvedUrls: previewServer.resolvedUrls,
			host: settings.config.server.host,
			site,
		})
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
		port: settings.config.server.port,
		closed,
		server: previewServer.httpServer,
		stop: async () => {
			await new Promise((resolve, reject) => {
				previewServer.httpServer.close((err) => (err ? reject(err) : resolve(undefined)));
			});
		},
	};
}
