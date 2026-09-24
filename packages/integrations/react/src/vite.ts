import type { AstroViteRenderer } from 'astro/vite';
import { getRenderer } from './container-renderer.js';
import {
	FAST_REFRESH_PREAMBLE,
	getViteConfiguration,
	type ReactIntegrationOptions,
} from './index.js';
import { getReactMajorVersion, isSupportedReactVersion, versionsConfig } from './version.js';

/** React renderer for `astro/vite`. */
export default function react(options: ReactIntegrationOptions = {}): AstroViteRenderer {
	const majorVersion = getReactMajorVersion();
	if (!isSupportedReactVersion(majorVersion)) {
		throw new Error(`Unsupported React version: ${majorVersion}.`);
	}
	const versionConfig = versionsConfig[majorVersion];
	return {
		renderer: getRenderer(versionConfig),
		plugins: getViteConfiguration(options, versionConfig).plugins,
		scripts: [
			{
				stage: 'before-hydration',
				content: FAST_REFRESH_PREAMBLE.replace(`__BASE__`, '/'),
				command: 'dev',
			},
		],
	};
}
