import type { ComponentInstance } from '../@types/astro.js';
import { loadRenderers } from '../core/render/index.js';
import { viteID } from '../core/util.js';
import { AggregateError, CSSError, MarkdownError } from '../core/errors/index.js';
import { enhanceViteSSRError } from '../core/errors/dev/index.js';
import type { DevelopmentEnvironment } from '../core/render/environment';

export async function preload({
	env,
	filePath,
}: {
	env: DevelopmentEnvironment;
	filePath: URL;
}): Promise<ComponentInstance> {
	// Important: This needs to happen first, in case a renderer provides polyfills.
	const renderers = await loadRenderers(env.settings, env.loader);
	// Override the environment's renderers. This ensures that if renderers change (HMR)
	// The new instances are passed through.
	env.renderers = renderers;

	try {
		// Load the module from the Vite SSR Runtime.
		const mod = (await env.loader.import(viteID(filePath))) as ComponentInstance;

		return mod;
	} catch (error) {
		// If the error came from Markdown or CSS, we already handled it and there's no need to enhance it
		if (MarkdownError.is(error) || CSSError.is(error) || AggregateError.is(error)) {
			throw error;
		}

		throw enhanceViteSSRError({ error, filePath, loader: env.loader });
	}
}

export { createController, runWithErrorHandling } from './controller.js';
export { default as vitePluginAstroServer } from './plugin.js';
export { handleRequest } from './request.js';
