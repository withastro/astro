import type { AstroMiddlewareInstance, ComponentInstance, RouteData } from '../../../@types/astro';
import { enhanceViteSSRError } from '../../errors/dev/index.js';
import { AggregateError, CSSError, MarkdownError } from '../../errors/index.js';
import { viteID } from '../../util.js';
import { loadRenderers } from '../index.js';
import type { DevelopmentEnvironment } from './environment';
export { createDevelopmentEnvironment } from './environment.js';
export type { DevelopmentEnvironment };

export interface SSROptions {
	/** The environment instance */
	env: DevelopmentEnvironment;
	/** location of file on disk */
	filePath: URL;
	/** the web request (needed for dynamic routes) */
	pathname: string;
	/** The runtime component instance */
	preload: ComponentInstance;
	/** Request */
	request: Request;
	/** optional, in case we need to render something outside of a dev server */
	route?: RouteData;
	/**
	 * Optional middlewares
	 */
	middleware?: AstroMiddlewareInstance<unknown>;
}

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
