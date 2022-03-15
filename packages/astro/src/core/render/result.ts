import type { AstroGlobal, AstroGlobalPartial, MarkdownParser, MarkdownRenderOptions, Params, Renderer, SSRElement, SSRResult } from '../../@types/astro';
import type { AstroRequest } from './request';

import { bold } from 'kleur/colors';
import { createRequest } from './request.js';
import { isCSSRequest } from './dev/css.js';
import { isScriptRequest } from './script.js';
import { renderSlot } from '../../runtime/server/index.js';
import { warn, LogOptions } from '../logger.js';

function onlyAvailableInSSR(name: string) {
	return function() {
		// TODO add more guidance when we have docs and adapters.
		throw new Error(`Oops, you are trying to use ${name}, which is only available with SSR.`)
	};
}

export interface CreateResultArgs {
	ssr: boolean;
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
	headers: Headers;
	method: string;
}

class Slots {
	#cache = new Map<string, string>();
	#result: SSRResult;
	#slots: Record<string, any> | null;

	constructor(result: SSRResult, slots: Record<string, any> | null) {
		this.#result = result;
		this.#slots = slots;
		if (slots) {
			for (const key of Object.keys(slots)) {
				if ((this as any)[key] !== undefined) {
					throw new Error(`Unable to create a slot named "${key}". "${key}" is a reserved slot name!\nPlease update the name of this slot.`);
				}
				Object.defineProperty(this, key, {
					get() {
						return true;
					},
					enumerable: true,
				});
			}
		}
	}

	public has(name: string) {
		if (!this.#slots) return false;
		return Boolean(this.#slots[name]);
	}

	public async render(name: string) {
		if (!this.#slots) return undefined;
		if (this.#cache.has(name)) {
			const result = this.#cache.get(name);
			return result;
		}
		if (!this.has(name)) return undefined;
		const content = await renderSlot(this.#result, this.#slots[name]).then((res) => (res != null ? res.toString() : res));
		this.#cache.set(name, content);
		return content;
	}
}

export function createResult(args: CreateResultArgs): SSRResult {
	const { legacyBuild, markdownRender, method, origin, headers, params, pathname, renderers, resolve, site } = args;

	const request = createRequest(method, pathname, headers, origin, site, args.ssr);
	request.params = params;

	// Create the result object that will be passed into the render function.
	// This object starts here as an empty shell (not yet the result) but then
	// calling the render() function will populate the object with scripts, styles, etc.
	const result: SSRResult = {
		styles: new Set<SSRElement>(),
		scripts: args.scripts ?? new Set<SSRElement>(),
		links: args.links ?? new Set<SSRElement>(),
		/** This function returns the `Astro` faux-global */
		createAstro(astroGlobal: AstroGlobalPartial, props: Record<string, any>, slots: Record<string, any> | null) {
			const astroSlots = new Slots(result, slots);

			return {
				__proto__: astroGlobal,
				props,
				request,
				redirect: args.ssr ? (path: string) => {
					return new Response(null, {
						status: 301,
						headers: {
							Location: path
						}
					});
				} : onlyAvailableInSSR('Astro.redirect'),
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
				slots: astroSlots,
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
			legacyBuild,
		},
	};

	return result;
}
