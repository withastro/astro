import type { AstroAdapter, AstroConfig, AstroIntegration } from 'astro';

import { emptyDir, writeJson } from '@astrojs/internal-helpers/fs';
import {
	type DevImageService,
	type VercelImageConfig,
	getAstroImageConfig,
	getDefaultImageConfig,
} from '../image/shared.js';
import { getRedirects } from '../lib/redirects.js';
import {
	type VercelWebAnalyticsConfig,
	getInjectableWebAnalyticsContent,
} from '../lib/web-analytics.js';

const PACKAGE_NAME = '@astrojs/vercel/static';

function getAdapter(): AstroAdapter {
	return {
		name: PACKAGE_NAME,
		supportedAstroFeatures: {
			sharpImageService: 'stable',
			staticOutput: 'stable',
			serverOutput: 'unsupported',
			hybridOutput: 'unsupported',
			envGetSecret: 'unsupported',
		},
		adapterFeatures: {
			buildOutput: 'static',
			edgeMiddleware: false,
		},
	};
}

export interface VercelStaticConfig {
	webAnalytics?: VercelWebAnalyticsConfig;
	imageService?: boolean;
	imagesConfig?: VercelImageConfig;
	devImageService?: DevImageService;
}

export default function vercelStatic({
	webAnalytics,
	imageService,
	imagesConfig,
	devImageService = 'sharp',
}: VercelStaticConfig = {}): AstroIntegration {
	let _config: AstroConfig;

	return {
		name: '@astrojs/vercel',
		hooks: {
			'astro:config:setup': async ({ command, config, injectScript, updateConfig }) => {
				if (webAnalytics?.enabled) {
					injectScript(
						'head-inline',
						await getInjectableWebAnalyticsContent({
							mode: command === 'dev' ? 'development' : 'production',
						})
					);
				}
				const outDir = new URL('./.vercel/output/static/', config.root);
				updateConfig({
					outDir,
					build: {
						format: 'directory',
						redirects: false,
					},
					...getAstroImageConfig(
						imageService,
						imagesConfig,
						command,
						devImageService,
						config.image
					),
				});
			},
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter());
				_config = config;
			},
			'astro:build:start': async () => {
				// Ensure to have `.vercel/output` empty.
				// This is because, when building to static, outDir = .vercel/output/static/,
				// so .vercel/output itself won't get cleaned.
				await emptyDir(new URL('./.vercel/output/', _config.root));
			},
			'astro:build:done': async ({ routes }) => {
				// Output configuration
				// https://vercel.com/docs/build-output-api/v3#build-output-configuration
				await writeJson(new URL('./.vercel/output/config.json', _config.root), {
					version: 3,
					routes: [
						...getRedirects(routes, _config),
						{
							src: `^/${_config.build.assets}/(.*)$`,
							headers: { 'cache-control': 'public, max-age=31536000, immutable' },
							continue: true,
						},
						{ handle: 'filesystem' },
						...(routes.find((route) => route.pathname === '/404')
							? [
									{
										// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
										src: `/.*`,
										// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
										dest: `/404.html`,
										status: 404,
									},
								]
							: []),
					],
					...(imageService || imagesConfig
						? {
								images: imagesConfig
									? {
											...imagesConfig,
											domains: [...imagesConfig.domains, ..._config.image.domains],
											remotePatterns: [
												...(imagesConfig.remotePatterns ?? []),
												..._config.image.remotePatterns,
											],
										}
									: getDefaultImageConfig(_config.image),
							}
						: {}),
				});
			},
		},
	};
}
