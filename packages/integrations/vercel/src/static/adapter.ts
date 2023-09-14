import type { AstroAdapter, AstroConfig, AstroIntegration } from 'astro';

import {
	getAstroImageConfig,
	getDefaultImageConfig,
	type DevImageService,
	type VercelImageConfig,
} from '../image/shared.js';
import { emptyDir, getVercelOutput, writeJson } from '../lib/fs.js';
import { isServerLikeOutput } from '../lib/prerender.js';
import { getRedirects } from '../lib/redirects.js';
import {
	getSpeedInsightsViteConfig,
	type VercelSpeedInsightsConfig,
} from '../lib/speed-insights.js';
import {
	getInjectableWebAnalyticsContent,
	type VercelWebAnalyticsConfig,
} from '../lib/web-analytics.js';

const PACKAGE_NAME = '@astrojs/vercel/static';

function getAdapter(): AstroAdapter {
	return {
		name: PACKAGE_NAME,
		supportedAstroFeatures: {
			assets: {
				supportKind: 'stable',
				isSquooshCompatible: true,
				isSharpCompatible: true,
			},
			staticOutput: 'stable',
			serverOutput: 'unsupported',
			hybridOutput: 'unsupported',
		},
		adapterFeatures: {
			edgeMiddleware: false,
			functionPerRoute: false,
		},
	};
}

export interface VercelStaticConfig {
	/**
	 * @deprecated
	 */
	analytics?: boolean;
	webAnalytics?: VercelWebAnalyticsConfig;
	speedInsights?: VercelSpeedInsightsConfig;
	imageService?: boolean;
	imagesConfig?: VercelImageConfig;
	devImageService?: DevImageService;
}

export default function vercelStatic({
	analytics,
	webAnalytics,
	speedInsights,
	imageService,
	imagesConfig,
	devImageService = 'sharp',
}: VercelStaticConfig = {}): AstroIntegration {
	let _config: AstroConfig;

	return {
		name: '@astrojs/vercel',
		hooks: {
			'astro:config:setup': async ({ command, config, injectScript, updateConfig, logger }) => {
				if (webAnalytics?.enabled || analytics) {
					if (analytics) {
						logger.warn(
							`The \`analytics\` property is deprecated. Please use the new \`webAnalytics\` and \`speedInsights\` properties instead.`
						);
					}

					injectScript(
						'head-inline',
						await getInjectableWebAnalyticsContent({
							mode: command === 'dev' ? 'development' : 'production',
						})
					);
				}
				if (command === 'build' && (speedInsights?.enabled || analytics)) {
					injectScript('page', 'import "@astrojs/vercel/speed-insights"');
				}
				const outDir = new URL('./static/', getVercelOutput(config.root));
				updateConfig({
					outDir,
					build: {
						format: 'directory',
						redirects: false,
					},
					vite: {
						...getSpeedInsightsViteConfig(speedInsights?.enabled || analytics),
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

				if (isServerLikeOutput(config)) {
					throw new Error(`${PACKAGE_NAME} should be used with output: 'static'`);
				}
			},
			'astro:build:start': async () => {
				// Ensure to have `.vercel/output` empty.
				// This is because, when building to static, outDir = .vercel/output/static/,
				// so .vercel/output itself won't get cleaned.
				await emptyDir(getVercelOutput(_config.root));
			},
			'astro:build:done': async ({ routes }) => {
				// Output configuration
				// https://vercel.com/docs/build-output-api/v3#build-output-configuration
				await writeJson(new URL(`./config.json`, getVercelOutput(_config.root)), {
					version: 3,
					routes: [
						...getRedirects(routes, _config),
						{
							src: `^/${_config.build.assets}/(.*)$`,
							headers: { 'cache-control': 'public, max-age=31536000, immutable' },
							continue: true,
						},
						{ handle: 'filesystem' },
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
