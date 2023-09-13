import type { ComponentInstance } from '../@types/astro.js';
import { enhanceViteSSRError } from '../core/errors/dev/index.js';
import { AggregateError, CSSError, MarkdownError } from '../core/errors/index.js';
import { viteID } from '../core/util.js';
import type DevPipeline from './devPipeline.js';

export async function preload({
	pipeline,
	filePath,
}: {
	pipeline: DevPipeline;
	filePath: URL;
}): Promise<ComponentInstance> {
	// Important: This needs to happen first, in case a renderer provides polyfills.
	await pipeline.loadRenderers();

	try {
		// Load the module from the Vite SSR Runtime.
		const mod = (await pipeline.getModuleLoader().import(viteID(filePath))) as ComponentInstance;

		return mod;
	} catch (error) {
		// If the error came from Markdown or CSS, we already handled it and there's no need to enhance it
		if (MarkdownError.is(error) || CSSError.is(error) || AggregateError.is(error)) {
			throw error;
		}

		throw enhanceViteSSRError({ error, filePath, loader: pipeline.getModuleLoader() });
	}
}

export { createController, runWithErrorHandling } from './controller.js';
export { default as vitePluginAstroServer } from './plugin.js';
export { handleRequest } from './request.js';
