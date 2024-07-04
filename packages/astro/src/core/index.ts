// This is the main entrypoint when importing the `astro` package.

import type { AstroInlineConfig } from '../@types/astro.js';
import { default as _build } from './build/index.js';
import { default as _sync } from './sync/index.js';
import { resolveConfig } from './config/config.js';
import { createNodeLogger } from './config/logging.js';
import { telemetry } from '../events/index.js';
import { eventCliSession } from '../events/session.js';
import { createSettings } from './config/settings.js';
import { runHookConfigSetup } from '../integrations/hooks.js';

export { default as dev } from './dev/index.js';
export { default as preview } from './preview/index.js';

/**
 * Builds your site for deployment. By default, this will generate static files and place them in a dist/ directory.
 * If SSR is enabled, this will generate the necessary server files to serve your site.
 *
 * @experimental The JavaScript API is experimental
 */
// Wrap `_build` to prevent exposing the second internal options parameter
export const build = (inlineConfig: AstroInlineConfig) => _build(inlineConfig);

/**
 * Generates TypeScript types for all Astro modules. This sets up a `src/env.d.ts` file for type inferencing,
 * and defines the `astro:content` module for the Content Collections API.
 *
 * @experimental The JavaScript API is experimental
 */
// Wrap `_sync` to prevent exposing the second internal options parameter
export const sync = async (inlineConfig: AstroInlineConfig) => {
	const logger = createNodeLogger(inlineConfig);
	const { userConfig, astroConfig } = await resolveConfig(inlineConfig ?? {}, 'sync');
	let settings = await createSettings(astroConfig, inlineConfig.root);
	telemetry.record(eventCliSession('sync', userConfig));
	settings = await runHookConfigSetup({
		command: 'build',
		settings,
		logger,
	});
	return await _sync({ settings, logger });
};
