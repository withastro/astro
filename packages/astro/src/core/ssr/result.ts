import type { AstroConfig, AstroGlobal, AstroGlobalPartial, Params, Renderer, SSRElement, SSRResult } from '../../@types/astro';

import { bold } from 'kleur/colors';
import { canonicalURL as getCanonicalURL } from '../util.js';
import { isCSSRequest } from './css.js';
import { renderSlot } from '../../runtime/server/index.js';
import { warn, LogOptions } from '../logger.js';

export interface CreateResultArgs {
	astroConfig: AstroConfig;
	logging: LogOptions;
	origin: string;
	params: Params;
	pathname: string;
	renderers: Renderer[];
	links?: Set<SSRElement>;
	scripts?: Set<SSRElement>;
}

export function createResult(args: CreateResultArgs): SSRResult {
	const { astroConfig, origin, params, pathname, renderers } = args;

	// Create the result object that will be passed into the render function.
	// This object starts here as an empty shell (not yet the result) but then
	// calling the render() function will populate the object with scripts, styles, etc.
	const result: SSRResult = {
		styles: new Set<SSRElement>(),
		scripts: args.scripts ?? new Set<SSRElement>(),
		links: args.links ?? new Set<SSRElement>(),
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
				resolve(path: string) {
					if (astroConfig.buildOptions.experimentalStaticBuild) {
						let extra = `This can be replaced with a dynamic import like so: await import("${path}")`;
						if (isCSSRequest(path)) {
							extra = `It looks like you are resolving styles. If you are adding a link tag, replace with this:

<style global>
@import "${path}";
</style>
`;
						}

						warn(
							args.logging,
							`deprecation`,
							`${bold('Astro.resolve()')} is deprecated. We see that you are trying to resolve ${path}.
${extra}`
						);
						// Intentionally return an empty string so that it is not relied upon.
						return '';
					}

					return astroGlobal.resolve(path);
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
