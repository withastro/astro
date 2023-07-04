import type { MarkdownRenderingOptions } from '@astrojs/markdown-remark';
import type { RuntimeMode, SSRLoadedRenderer } from '../../@types/astro';
import type { LogOptions } from '../logger/core.js';
import type { RouteCache } from './route-cache.js';

/**
 * An environment represents the static parts of rendering that do not change
 * between requests. These are mostly known when the server first starts up and do not change.
 * Thus they can be created once and passed through to renderPage on each request.
 */
export interface Environment {
	/**
	 * Used to provide better error messages for `Astro.clientAddress`
	 */
	adapterName?: string;
	/** logging options */
	logging: LogOptions;
	/**
	 * Used to support `Astro.__renderMarkdown` for legacy `<Markdown />` component
	 */
	markdown: MarkdownRenderingOptions;
	/** "development" or "production" */
	mode: RuntimeMode;
	renderers: SSRLoadedRenderer[];
	clientDirectives: Map<string, string>;
	resolve: (s: string) => Promise<string>;
	routeCache: RouteCache;
	/**
	 * Used for `Astro.site`
	 */
	site?: string;
	/**
	 * Value of Astro config's `output` option, true if "server" or "hybrid"
	 */
	ssr: boolean;
	streaming: boolean;
}

export type CreateEnvironmentArgs = Environment;

export function createEnvironment(options: CreateEnvironmentArgs): Environment {
	return options;
}
