import type { AstroConfig, AstroGlobal, AstroGlobalPartial, Params, Renderer, SSRElement, SSRResult } from '../../@types/astro';

import { canonicalURL as getCanonicalURL } from '../util.js';
import { renderSlot } from '../../runtime/server/index.js';

export interface CreateResultArgs {
	astroConfig: AstroConfig;
	origin: string;
	params: Params;
	pathname: string;
	renderers: Renderer[];
}

export function createResult(args: CreateResultArgs): SSRResult {
	const { astroConfig, origin, params, pathname, renderers } = args;

	// Create the result object that will be passed into the render function.
	// This object starts here as an empty shell (not yet the result) but then
	// calling the render() function will populate the object with scripts, styles, etc.
	const result: SSRResult = {
		styles: new Set<SSRElement>(),
		scripts: new Set<SSRElement>(),
		links: new Set<SSRElement>(),
		/** This function returns the `Astro` faux-global */
		createAstro(astroGlobal: AstroGlobalPartial, props: Record<string, any>, slots: Record<string, any> | null) {
			const site = new URL(origin);
			const url = new URL('.' + pathname, site);
			const canonicalURL = getCanonicalURL('.' + pathname, astroConfig.buildOptions.site || origin);
			return {
				__proto__: astroGlobal,
				props,
				request: {
					canonicalURL,
					params,
					url,
				},
				slots: Object.fromEntries(Object.entries(slots || {}).map(([slotName]) => [slotName, true])),
				// This is used for <Markdown> but shouldn't be used publicly
				privateRenderSlotDoNotUse(slotName: string) {
					return renderSlot(result, slots ? slots[slotName] : null);
				},
				// <Markdown> also needs the same `astroConfig.markdownOptions.render` as `.md` pages
				async privateRenderMarkdownDoNotUse(content: string, opts: any) {
					let mdRender = astroConfig.markdownOptions.render;
					let renderOpts = {};
					if (Array.isArray(mdRender)) {
						renderOpts = mdRender[1];
						mdRender = mdRender[0];
					}
					// ['rehype-toc', opts]
					if (typeof mdRender === 'string') {
						({ default: mdRender } = await import(mdRender));
					}
					// [import('rehype-toc'), opts]
					else if (mdRender instanceof Promise) {
						({ default: mdRender } = await mdRender);
					}
					const { code } = await mdRender(content, { ...renderOpts, ...(opts ?? {}) });
					return code;
				},
			} as unknown as AstroGlobal;
		},
		// This is a stub and will be implemented by dev and build.
		async resolve(s: string): Promise<string> {
			return '';
		},
		_metadata: {
			renderers,
			pathname,
			experimentalStaticBuild: astroConfig.buildOptions.experimentalStaticBuild,
		},
	};

	return result;
}
