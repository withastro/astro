import { fileURLToPath } from 'node:url';
import { stringifyForScript } from '@astrojs/runtime/_internal/server/escape.js';
import type { SSRElement } from '@astrojs/vite-plugin-astro';
import { getPackageManager } from '../cli/info/core/get-package-manager.js';
import { DevDebugInfoProvider } from '../cli/info/infra/dev-debug-info-provider.js';
import { ProcessNodeVersionProvider } from '../cli/info/infra/process-node-version-provider.js';
import { ProcessPackageManagerUserAgentProvider } from '../cli/info/infra/process-package-manager-user-agent-provider.js';
import { StyledDebugInfoFormatter } from '../cli/info/infra/styled-debug-info-formatter.js';
import { BuildTimeAstroVersionProvider } from '../cli/infra/build-time-astro-version-provider.js';
import { PassthroughTextStyler } from '../cli/infra/passthrough-text-styler.js';
import { ProcessOperatingSystemProvider } from '../cli/infra/process-operating-system-provider.js';
import { TinyexecCommandExecutor } from '../cli/infra/tinyexec-command-executor.js';
import { ASTRO_VERSION } from '../core/constants.js';
import type { AstroSettings } from '../types/astro.js';
import type { DevToolbarMetadata } from '../types/public/index.js';
import type { DevHeadElements } from '@astrojs/vite-plugin-router/_internal/vite-plugin-app/environment.js';

async function getDebugInfo(settings: AstroSettings): Promise<string> {
	const debugInfoProvider = new DevDebugInfoProvider({
		config: settings.config,
		astroVersionProvider: new BuildTimeAstroVersionProvider(),
		operatingSystemProvider: new ProcessOperatingSystemProvider(),
		packageManager: await getPackageManager({
			packageManagerUserAgentProvider: new ProcessPackageManagerUserAgentProvider(),
			commandExecutor: new TinyexecCommandExecutor(),
		}),
		nodeVersionProvider: new ProcessNodeVersionProvider(),
	});
	const debugInfoFormatter = new StyledDebugInfoFormatter({
		textStyler: new PassthroughTextStyler(),
	});
	return debugInfoFormatter.format(await debugInfoProvider.get());
}

/**
 * The dev head elements of an Astro project: the dev toolbar on pages, and the
 * `injectScript('head-inline')` scripts of integrations on every route.
 */
export function createDevHeadElements(settings: AstroSettings): DevHeadElements {
	let debugInfo: Promise<string> | undefined;
	return async ({ manifest, isPage }) => {
		const elements: SSRElement[] = [];
		if (isPage && manifest.devToolbar.enabled) {
			elements.push({
				props: {
					type: 'module',
					src: '/@id/astro/runtime/client/dev-toolbar/entrypoint.js',
				},
				children: '',
			});

			const additionalMetadata: DevToolbarMetadata['__astro_dev_toolbar__'] = {
				root: fileURLToPath(settings.config.root),
				version: ASTRO_VERSION,
				latestAstroVersion: settings.latestAstroVersion,
				// TODO: The debug info is fetched for the first page even when the toolbar is never
				// opened. Requesting it through import.meta.hot when the button is clicked would defer
				// it as much as possible.
				debugInfo: await (debugInfo ??= getDebugInfo(settings)),
				placement: settings.config.devToolbar.placement,
			};

			// Additional data for the dev overlay
			const children = `window.__astro_dev_toolbar__ = ${stringifyForScript(additionalMetadata)}`;
			elements.push({ props: {}, children });
		}

		// TODO: We should allow adding generic HTML elements to the head, not just scripts
		for (const script of settings.scripts) {
			if (script.stage === 'head-inline') {
				elements.push({ props: {}, children: script.content });
			}
		}
		return elements;
	};
}
