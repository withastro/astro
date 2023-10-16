import type { AstroAdapter, AstroFeatureMap } from 'astro';

export function getAdapter({
	isModeDirectory,
	functionPerRoute,
}: {
	isModeDirectory: boolean;
	functionPerRoute: boolean;
}): AstroAdapter {
	const astroFeatures = {
		hybridOutput: 'stable',
		staticOutput: 'unsupported',
		serverOutput: 'stable',
		assets: {
			supportKind: 'stable',
			isSharpCompatible: false,
			isSquooshCompatible: false,
		},
	} satisfies AstroFeatureMap;

	if (isModeDirectory) {
		return {
			name: '@astrojs/cloudflare',
			serverEntrypoint: '@astrojs/cloudflare/entrypoints/server.directory.js',
			exports: ['onRequest', 'manifest'],
			adapterFeatures: {
				functionPerRoute,
				edgeMiddleware: false,
			},
			supportedAstroFeatures: astroFeatures,
		};
	}

	return {
		name: '@astrojs/cloudflare',
		serverEntrypoint: '@astrojs/cloudflare/entrypoints/server.advanced.js',
		exports: ['default'],
		supportedAstroFeatures: astroFeatures,
	};
}
