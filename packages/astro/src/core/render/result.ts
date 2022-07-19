import type { MarkdownRenderingOptions } from '@astrojs/markdown-remark';
import { bold } from 'kleur/colors';
import type {
	AstroGlobal,
	AstroGlobalPartial,
	Page,
	Params,
	Props,
	RuntimeMode,
	SSRElement,
	SSRLoadedRenderer,
	SSRResult,
} from '../../@types/astro';
import { renderSlot } from '../../runtime/server/index.js';
import { LogOptions, warn } from '../logger/core.js';
import { isScriptRequest } from './script.js';
import { createCanonicalURL, isCSSRequest } from './util.js';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

function onlyAvailableInSSR(name: string) {
	return function _onlyAvailableInSSR() {
		// TODO add more guidance when we have docs and adapters.
		throw new Error(`Oops, you are trying to use ${name}, which is only available with SSR.`);
	};
}

export interface CreateResultArgs {
	adapterName: string | undefined;
	ssr: boolean;
	streaming: boolean;
	logging: LogOptions;
	origin: string;
	markdown: MarkdownRenderingOptions;
	mode: RuntimeMode;
	params: Params;
	pathname: string;
	props: Props;
	renderers: SSRLoadedRenderer[];
	resolve: (s: string) => Promise<string>;
	site: string | undefined;
	links?: Set<SSRElement>;
	scripts?: Set<SSRElement>;
	styles?: Set<SSRElement>;
	request: Request;
}

function getFunctionExpression(slot: any) {
	if (!slot) return;
	if (slot.expressions?.length !== 1) return;
	return slot.expressions[0] as (...args: any[]) => any;
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
					throw new Error(
						`Unable to create a slot named "${key}". "${key}" is a reserved slot name!\nPlease update the name of this slot.`
					);
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

	public async render(name: string, args: any[] = []) {
		const cacheable = args.length === 0;
		if (!this.#slots) return undefined;
		if (cacheable && this.#cache.has(name)) {
			const result = this.#cache.get(name);
			return result;
		}
		if (!this.has(name)) return undefined;
		if (!cacheable) {
			const component = await this.#slots[name]();
			const expression = getFunctionExpression(component);
			if (expression) {
				const slot = expression(...args);
				return await renderSlot(this.#result, slot).then((res) =>
					res != null ? String(res) : res
				);
			}
		}
		const content = await renderSlot(this.#result, this.#slots[name]).then((res) =>
			res != null ? String(res) : res
		);
		if (cacheable) this.#cache.set(name, content);
		return content;
	}
}

let renderMarkdown: any = null;

function isPaginatedRoute({ page }: { page?: Page }) {
	return page && 'currentPage' in page;
}

export function createResult(args: CreateResultArgs): SSRResult {
	const { markdown, params, pathname, props: pageProps, renderers, request, resolve, site } = args;

	const paginated = isPaginatedRoute(pageProps);
	const url = new URL(request.url);
	const canonicalURL = createCanonicalURL('.' + pathname, site ?? url.origin, paginated);
	const headers = new Headers();
	if (args.streaming) {
		headers.set('Transfer-Encoding', 'chunked');
	} else {
		headers.set('Content-Type', 'text/html');
	}
	const response: ResponseInit = {
		status: 200,
		statusText: 'OK',
		headers,
	};

	// Make headers be read-only
	Object.defineProperty(response, 'headers', {
		value: response.headers,
		enumerable: true,
		writable: false,
	});

	// Create the result object that will be passed into the render function.
	// This object starts here as an empty shell (not yet the result) but then
	// calling the render() function will populate the object with scripts, styles, etc.
	const result: SSRResult = {
		styles: args.styles ?? new Set<SSRElement>(),
		scripts: args.scripts ?? new Set<SSRElement>(),
		links: args.links ?? new Set<SSRElement>(),
		/** This function returns the `Astro` faux-global */
		createAstro(
			astroGlobal: AstroGlobalPartial,
			props: Record<string, any>,
			slots: Record<string, any> | null
		) {
			const astroSlots = new Slots(result, slots);

			const Astro = {
				__proto__: astroGlobal,
				canonicalURL,
				get clientAddress() {
					if(!(clientAddressSymbol in request)) {
						if(args.adapterName) {
							throw new Error(`Astro.clientAddress is not available in the ${args.adapterName} adapter. File an issue with the adapter to add support.`);
						} else {
							throw new Error(`Astro.clientAddress is not available in your environment. Ensure that you are using an SSR adapter that supports this feature.`)
						}
					}

					return Reflect.get(request, clientAddressSymbol);
				},
				params,
				props,
				request,
				redirect: args.ssr
					? (path: string) => {
							return new Response(null, {
								status: 302,
								headers: {
									Location: path,
								},
							});
					  }
					: onlyAvailableInSSR('Astro.redirect'),
				resolve(path: string) {
					let extra = `This can be replaced with a dynamic import like so: await import("${path}")`;
					if (isCSSRequest(path)) {
						extra = `It looks like you are resolving styles. If you are adding a link tag, replace with this:
---
import "${path}";
---
`;
					} else if (isScriptRequest(path)) {
						extra = `It looks like you are resolving scripts. If you are adding a script tag, replace with this:

<script type="module" src={(await import("${path}?url")).default}></script>

or consider make it a module like so:

<script>
	import MyModule from "${path}";
</script>
`;
					}

					warn(
						args.logging,
						`deprecation`,
						`${bold(
							'Astro.resolve()'
						)} is deprecated. We see that you are trying to resolve ${path}.
${extra}`
					);
					// Intentionally return an empty string so that it is not relied upon.
					return '';
				},
				response,
				slots: astroSlots,
			} as unknown as AstroGlobal;

			Object.defineProperty(Astro, '__renderMarkdown', {
				// Ensure this API is not exposed to users
				enumerable: false,
				writable: false,
				// TODO: Remove this hole "Deno" logic once our plugin gets Deno support
				value: async function (content: string, opts: MarkdownRenderingOptions) {
					// @ts-ignore
					if (typeof Deno !== 'undefined') {
						throw new Error('Markdown is not supported in Deno SSR');
					}

					if (!renderMarkdown) {
						// The package is saved in this variable because Vite is too smart
						// and will try to inline it in buildtime
						let astroRemark = '@astrojs/markdown-remark';

						renderMarkdown = (await import(astroRemark)).renderMarkdown;
					}

					const { code } = await renderMarkdown(content, { ...markdown, ...(opts ?? {}) });
					return code;
				},
			});

			return Astro;
		},
		resolve,
		_metadata: {
			renderers,
			pathname,
		},
		response,
	};

	return result;
}
