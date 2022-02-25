import type { AstroGlobal, AstroGlobalPartial, MarkdownParser, MarkdownRenderOptions, Params, Renderer, SSRElement, SSRResult } from '../../@types/astro';

import { bold } from 'kleur/colors';
import { canonicalURL as getCanonicalURL } from '../util.js';
import { isCSSRequest } from './dev/css.js';
import { isScriptRequest } from './script.js';
import { renderSlot } from '../../runtime/server/index.js';
import { warn, LogOptions } from '../logger.js';

export interface CreateResultArgs {
	legacyBuild: boolean;
	logging: LogOptions;
	origin: string;
	markdownRender: MarkdownRenderOptions;
	params: Params;
	pathname: string;
	renderers: Renderer[];
	resolve: (s: string) => Promise<string>;
	site: string | undefined;
	links?: Set<SSRElement>;
	scripts?: Set<SSRElement>;
}

export function createResult(args: CreateResultArgs): SSRResult {
	const { legacyBuild, origin, markdownRender, params, pathname, renderers, resolve, site: buildOptionsSite } = args;

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
			const canonicalURL = getCanonicalURL('.' + pathname, buildOptionsSite || origin);
			return {
				__proto__: astroGlobal,
				props,
				request: {
					canonicalURL,
					params,
					url,
				},
				resolve(path: string) {
					if (!legacyBuild) {
						let extra = `This can be replaced with a dynamic import like so: await import("${path}")`;
						if (isCSSRequest(path)) {
							extra = `It looks like you are resolving styles. If you are adding a link tag, replace with this:

<style global>
@import "${path}";
</style>
`;
						} else if (isScriptRequest(path)) {
							extra = `It looks like you are resolving scripts. If you are adding a script tag, replace with this:

<script type="module" src={(await import("${path}?url")).default}></script>

or consider make it a module like so:

<script type="module" hoist>
	import MyModule from "${path}";
</script>
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
					let [mdRender, renderOpts] = markdownRender;
					let parser: MarkdownParser | null = null;
					//let renderOpts = {};
					if (Array.isArray(mdRender)) {
						renderOpts = mdRender[1];
						mdRender = mdRender[0];
					}
					// ['rehype-toc', opts]
					if (typeof mdRender === 'string') {
						const mod: { default: MarkdownParser } = await import(mdRender);
						parser = mod.default;
					}
					// [import('rehype-toc'), opts]
					else if (mdRender instanceof Promise) {
						const mod: { default: MarkdownParser } = await mdRender;
						parser = mod.default;
					} else if (typeof mdRender === 'function') {
						parser = mdRender;
					} else {
						throw new Error('No Markdown parser found.');
					}
					const { code } = await parser(content, { ...renderOpts, ...(opts ?? {}) });
					return code;
				},
			} as unknown as AstroGlobal;
		},
		resolve,
		_metadata: {
			renderers,
			pathname,
			legacyBuild
		},
	};

	return result;
}
