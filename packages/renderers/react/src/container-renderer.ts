import type { AstroRenderer } from 'astro';
import {
	getReactMajorVersion,
	isSupportedReactVersion,
	type ReactVersionConfig,
	versionsConfig,
} from './version.js';

export function getRenderer(reactConfig: ReactVersionConfig): AstroRenderer {
	return {
		name: '@astrojs/react',
		clientEntrypoint: reactConfig.client,
		serverEntrypoint: reactConfig.server,
	};
}

export function getContainerRenderer(): AstroRenderer {
	const majorVersion = getReactMajorVersion();
	if (!isSupportedReactVersion(majorVersion)) {
		throw new Error(`Unsupported React version: ${majorVersion}.`);
	}
	return getRenderer(versionsConfig[majorVersion]);
}
