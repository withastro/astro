import type {
	APIContext,
	AstroComponentMetadata,
	AstroGlobalPartial,
	EndpointHandler,
	Params,
	SSRElement,
	SSRLoadedRenderer,
	SSRResult,
} from '../../@types/astro';

import { escapeHTML, HTMLString, markHTMLString } from './escape.js';
import { extractDirectives, generateHydrateScript } from './hydration.js';
import { createResponse } from './response.js';
import {
	determineIfNeedsHydrationScript,
	determinesIfNeedsDirectiveScript,
	getPrescripts,
	PrescriptType,
} from './scripts.js';
import { serializeProps } from './serialize.js';
import { shorthash } from './shorthash.js';
import { serializeListValue } from './util.js';

export {
	escapeHTML,
	HTMLString,
	markHTMLString,
	markHTMLString as unescapeHTML,
} from './escape.js';
export type { Metadata } from './metadata';
export { createMetadata } from './metadata.js';

export const voidElementNames =
	/^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
const htmlBooleanAttributes =
	/^(allowfullscreen|async|autofocus|autoplay|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|hidden|loop|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|itemscope)$/i;
const htmlEnumAttributes = /^(contenteditable|draggable|spellcheck|value)$/i;
// Note: SVG is case-sensitive!
const svgEnumAttributes = /^(autoReverse|externalResourcesRequired|focusable|preserveAlpha)$/i;

// INVESTIGATE:
// 2. Less anys when possible and make it well known when they are needed.

// Used to render slots and expressions
// INVESTIGATE: Can we have more specific types both for the argument and output?
// If these are intentional, add comments that these are intention and why.
// Or maybe type UserValue = any; ?
async function* _render(child: any): AsyncIterable<any> {
	child = await child;
	if (child instanceof HTMLString) {
		yield child;
	} else if (Array.isArray(child)) {
		for (const value of child) {
			yield markHTMLString(await _render(value));
		}
	} else if (typeof child === 'function') {
		// Special: If a child is a function, call it automatically.
		// This lets you do {() => ...} without the extra boilerplate
		// of wrapping it in a function and calling it.
		yield* _render(child());
	} else if (typeof child === 'string') {
		yield markHTMLString(escapeHTML(child));
	} else if (!child && child !== 0) {
		// do nothing, safe to ignore falsey values.
	}
	// Add a comment explaining why each of these are needed.
	// Maybe create clearly named function for what this is doing.
	else if (
		child instanceof AstroComponent ||
		Object.prototype.toString.call(child) === '[object AstroComponent]'
	) {
		yield* renderAstroComponent(child);
	} else if (typeof child === 'object' && Symbol.asyncIterator in child) {
		yield* child;
	} else {
		yield child;
	}
}

// The return value when rendering a component.
// This is the result of calling render(), should this be named to RenderResult or...?
export class AstroComponent {
	private htmlParts: TemplateStringsArray;
	private expressions: any[];

	constructor(htmlParts: TemplateStringsArray, expressions: any[]) {
		this.htmlParts = htmlParts;
		this.expressions = expressions;
	}

	get [Symbol.toStringTag]() {
		return 'AstroComponent';
	}

	async *[Symbol.asyncIterator]() {
		const { htmlParts, expressions } = this;

		for (let i = 0; i < htmlParts.length; i++) {
			const html = htmlParts[i];
			const expression = expressions[i];

			yield markHTMLString(html);
			yield* _render(expression);
		}
	}
}

function isAstroComponent(obj: any): obj is AstroComponent {
	return (
		typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object AstroComponent]'
	);
}

export async function render(htmlParts: TemplateStringsArray, ...expressions: any[]) {
	return new AstroComponent(htmlParts, expressions);
}

// The callback passed to to $$createComponent
export interface AstroComponentFactory {
	(result: any, props: any, slots: any): ReturnType<typeof render> | Response;
	isAstroComponentFactory?: boolean;
}

// Used in creating the component. aka the main export.
export function createComponent(cb: AstroComponentFactory) {
	// Add a flag to this callback to mark it as an Astro component
	// INVESTIGATE does this need to cast
	(cb as any).isAstroComponentFactory = true;
	return cb;
}

export async function renderSlot(_result: any, slotted: string, fallback?: any): Promise<string> {
	if (slotted) {
		let iterator = _render(slotted);
		let content = '';
		for await (const chunk of iterator) {
			content += chunk;
		}
		return markHTMLString(content);
	}
	return fallback;
}

export function mergeSlots(...slotted: unknown[]) {
	const slots: Record<string, () => any> = {};
	for (const slot of slotted) {
		if (!slot) continue;
		if (typeof slot === 'object') {
			Object.assign(slots, slot);
		} else if (typeof slot === 'function') {
			Object.assign(slots, mergeSlots(slot()));
		}
	}
	return slots;
}

export const Fragment = Symbol.for('astro:fragment');
export const Renderer = Symbol.for('astro:renderer');
export const ClientOnlyPlaceholder = 'astro-client-only';

function guessRenderers(componentUrl?: string): string[] {
	const extname = componentUrl?.split('.').pop();
	switch (extname) {
		case 'svelte':
			return ['@astrojs/svelte'];
		case 'vue':
			return ['@astrojs/vue'];
		case 'jsx':
		case 'tsx':
			return ['@astrojs/react', '@astrojs/preact'];
		default:
			return ['@astrojs/react', '@astrojs/preact', '@astrojs/vue', '@astrojs/svelte'];
	}
}

function formatList(values: string[]): string {
	if (values.length === 1) {
		return values[0];
	}
	return `${values.slice(0, -1).join(', ')} or ${values[values.length - 1]}`;
}

const rendererAliases = new Map([['solid', 'solid-js']]);

/** @internal Assosciate JSX components with a specific renderer (see /src/vite-plugin-jsx/tag.ts) */
export function __astro_tag_component__(Component: unknown, rendererName: string) {
	if (!Component) return;
	if (typeof Component !== 'function') return;
	Object.defineProperty(Component, Renderer, {
		value: rendererName,
		enumerable: false,
		writable: false,
	});
}

export async function renderComponent(
	result: SSRResult,
	displayName: string,
	Component: unknown,
	_props: Record<string | number, any>,
	slots: any = {}
): Promise<string | AsyncIterable<string>> {
	Component = await Component;
	if (Component === Fragment) {
		const children = await renderSlot(result, slots?.default);
		if (children == null) {
			return children;
		}
		return markHTMLString(children);
	}

	if (Component && typeof Component === 'object' && (Component as any)['astro:html']) {
		const children: Record<string, string> = {};
		if (slots) {
			await Promise.all(
				Object.entries(slots).map(([key, value]) =>
					renderSlot(result, value as string).then((output) => {
						children[key] = output;
					})
				)
			);
		}
		const html = (Component as any).render({ slots: children });
		return markHTMLString(html);
	}

	if (Component && (Component as any).isAstroComponentFactory) {
		async function* renderAstroComponentInline(): AsyncGenerator<string, void, undefined> {
			let iterable = await renderToIterable(result, Component as any, _props, slots);
			yield* iterable;
		}

		return renderAstroComponentInline();
	}

	if (!Component && !_props['client:only']) {
		throw new Error(
			`Unable to render ${displayName} because it is ${Component}!\nDid you forget to import the component or is it possible there is a typo?`
		);
	}

	const { renderers } = result._metadata;
	const metadata: AstroComponentMetadata = { displayName };

	const { hydration, isPage, props } = extractDirectives(_props);
	let html = '';
	let needsHydrationScript = hydration && determineIfNeedsHydrationScript(result);
	let needsDirectiveScript =
		hydration && determinesIfNeedsDirectiveScript(result, hydration.directive);

	if (hydration) {
		metadata.hydrate = hydration.directive as AstroComponentMetadata['hydrate'];
		metadata.hydrateArgs = hydration.value;
		metadata.componentExport = hydration.componentExport;
		metadata.componentUrl = hydration.componentUrl;
	}
	const probableRendererNames = guessRenderers(metadata.componentUrl);

	if (
		Array.isArray(renderers) &&
		renderers.length === 0 &&
		typeof Component !== 'string' &&
		!componentIsHTMLElement(Component)
	) {
		const message = `Unable to render ${metadata.displayName}!

There are no \`integrations\` set in your \`astro.config.mjs\` file.
Did you mean to add ${formatList(probableRendererNames.map((r) => '`' + r + '`'))}?`;
		throw new Error(message);
	}

	const children: Record<string, string> = {};
	if (slots) {
		await Promise.all(
			Object.entries(slots).map(([key, value]) =>
				renderSlot(result, value as string).then((output) => {
					children[key] = output;
				})
			)
		);
	}

	// Call the renderers `check` hook to see if any claim this component.
	let renderer: SSRLoadedRenderer | undefined;
	if (metadata.hydrate !== 'only') {
		// If this component ran through `__astro_tag_component__`, we already know
		// which renderer to match to and can skip the usual `check` calls.
		// This will help us throw most relevant error message for modules with runtime errors
		if (Component && (Component as any)[Renderer]) {
			const rendererName = (Component as any)[Renderer];
			renderer = renderers.find(({ name }) => name === rendererName);
		}

		if (!renderer) {
			let error;
			for (const r of renderers) {
				try {
					if (await r.ssr.check.call({ result }, Component, props, children)) {
						renderer = r;
						break;
					}
				} catch (e) {
					error ??= e;
				}
			}

			if (error) {
				throw error;
			}
		}

		if (!renderer && typeof HTMLElement === 'function' && componentIsHTMLElement(Component)) {
			const output = renderHTMLElement(result, Component as typeof HTMLElement, _props, slots);

			return output;
		}
	} else {
		// Attempt: use explicitly passed renderer name
		if (metadata.hydrateArgs) {
			const passedName = metadata.hydrateArgs;
			const rendererName = rendererAliases.has(passedName)
				? rendererAliases.get(passedName)
				: passedName;
			renderer = renderers.find(
				({ name }) => name === `@astrojs/${rendererName}` || name === rendererName
			);
		}
		// Attempt: user only has a single renderer, default to that
		if (!renderer && renderers.length === 1) {
			renderer = renderers[0];
		}
		// Attempt: can we guess the renderer from the export extension?
		if (!renderer) {
			const extname = metadata.componentUrl?.split('.').pop();
			renderer = renderers.filter(
				({ name }) => name === `@astrojs/${extname}` || name === extname
			)[0];
		}
	}

	// If no one claimed the renderer
	if (!renderer) {
		if (metadata.hydrate === 'only') {
			// TODO: improve error message
			throw new Error(`Unable to render ${metadata.displayName}!

Using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.
Did you mean to pass <${metadata.displayName} client:only="${probableRendererNames
				.map((r) => r.replace('@astrojs/', ''))
				.join('|')}" />
`);
		} else if (typeof Component !== 'string') {
			const matchingRenderers = renderers.filter((r) => probableRendererNames.includes(r.name));
			const plural = renderers.length > 1;
			if (matchingRenderers.length === 0) {
				throw new Error(`Unable to render ${metadata.displayName}!

There ${plural ? 'are' : 'is'} ${renderers.length} renderer${
					plural ? 's' : ''
				} configured in your \`astro.config.mjs\` file,
but ${plural ? 'none were' : 'it was not'} able to server-side render ${metadata.displayName}.

Did you mean to enable ${formatList(probableRendererNames.map((r) => '`' + r + '`'))}?`);
			} else if (matchingRenderers.length === 1) {
				// We already know that renderer.ssr.check() has failed
				// but this will throw a much more descriptive error!
				renderer = matchingRenderers[0];
				({ html } = await renderer.ssr.renderToStaticMarkup.call(
					{ result },
					Component,
					props,
					children,
					metadata
				));
			} else {
				throw new Error(`Unable to render ${metadata.displayName}!

This component likely uses ${formatList(probableRendererNames)},
but Astro encountered an error during server-side rendering.

Please ensure that ${metadata.displayName}:
1. Does not unconditionally access browser-specific globals like \`window\` or \`document\`.
   If this is unavoidable, use the \`client:only\` hydration directive.
2. Does not conditionally return \`null\` or \`undefined\` when rendered on the server.

If you're still stuck, please open an issue on GitHub or join us at https://astro.build/chat.`);
			}
		}
	} else {
		if (metadata.hydrate === 'only') {
			html = await renderSlot(result, slots?.fallback);
		} else {
			({ html } = await renderer.ssr.renderToStaticMarkup.call(
				{ result },
				Component,
				props,
				children,
				metadata
			));
		}
	}

	// HACK! The lit renderer doesn't include a clientEntrypoint for custom elements, allow it
	// to render here until we find a better way to recognize when a client entrypoint isn't required.
	if (
		renderer &&
		!renderer.clientEntrypoint &&
		renderer.name !== '@astrojs/lit' &&
		metadata.hydrate
	) {
		throw new Error(
			`${metadata.displayName} component has a \`client:${metadata.hydrate}\` directive, but no client entrypoint was provided by ${renderer.name}!`
		);
	}

	// This is a custom element without a renderer. Because of that, render it
	// as a string and the user is responsible for adding a script tag for the component definition.
	if (!html && typeof Component === 'string') {
		const childSlots = Object.values(children).join('');
		const iterable = renderAstroComponent(
			await render`<${Component}${internalSpreadAttributes(props)}${markHTMLString(
				childSlots === '' && voidElementNames.test(Component)
					? `/>`
					: `>${childSlots}</${Component}>`
			)}`
		);
		html = '';
		for await (const chunk of iterable) {
			html += chunk;
		}
	}

	if (!hydration) {
		if (isPage || renderer?.name === 'astro:jsx') {
			return html;
		}
		return markHTMLString(html.replace(/\<\/?astro-slot\>/g, ''));
	}

	// Include componentExport name, componentUrl, and props in hash to dedupe identical islands
	const astroId = shorthash(
		`<!--${metadata.componentExport!.value}:${metadata.componentUrl}-->\n${html}\n${serializeProps(
			props
		)}`
	);

	const island = await generateHydrateScript(
		{ renderer: renderer!, result, astroId, props },
		metadata as Required<AstroComponentMetadata>
	);

	// Render template if not all astro fragments are provided.
	let unrenderedSlots: string[] = [];
	if (html) {
		if (Object.keys(children).length > 0) {
			for (const key of Object.keys(children)) {
				if (!html.includes(key === 'default' ? `<astro-slot>` : `<astro-slot name="${key}">`)) {
					unrenderedSlots.push(key);
				}
			}
		}
	} else {
		unrenderedSlots = Object.keys(children);
	}
	const template =
		unrenderedSlots.length > 0
			? unrenderedSlots
					.map(
						(key) =>
							`<template data-astro-template${key !== 'default' ? `="${key}"` : ''}>${
								children[key]
							}</template>`
					)
					.join('')
			: '';

	island.children = `${html ?? ''}${template}`;

	if (island.children) {
		island.props['await-children'] = '';
	}

	// Scripts to prepend
	let prescriptType: PrescriptType = needsHydrationScript
		? 'both'
		: needsDirectiveScript
		? 'directive'
		: null;
	let prescripts = getPrescripts(prescriptType, hydration.directive);

	return markHTMLString(prescripts + renderElement('astro-island', island, false));
}

/** Create the Astro.fetchContent() runtime function. */
function createDeprecatedFetchContentFn() {
	return () => {
		throw new Error('Deprecated: Astro.fetchContent() has been replaced with Astro.glob().');
	};
}

/** Create the Astro.glob() runtime function. */
function createAstroGlobFn() {
	const globHandler = (importMetaGlobResult: Record<string, any>, globValue: () => any) => {
		let allEntries = [...Object.values(importMetaGlobResult)];
		if (allEntries.length === 0) {
			throw new Error(`Astro.glob(${JSON.stringify(globValue())}) - no matches found.`);
		}
		// Map over the `import()` promises, calling to load them.
		return Promise.all(allEntries.map((fn) => fn()));
	};
	// Cast the return type because the argument that the user sees (string) is different from the argument
	// that the runtime sees post-compiler (Record<string, Module>).
	return globHandler as unknown as AstroGlobalPartial['glob'];
}

// This is used to create the top-level Astro global; the one that you can use
// Inside of getStaticPaths.
export function createAstro(
	filePathname: string,
	_site: string | undefined,
	projectRootStr: string
): AstroGlobalPartial {
	const site = _site ? new URL(_site) : undefined;
	const referenceURL = new URL(filePathname, `http://localhost`);
	const projectRoot = new URL(projectRootStr);
	return {
		site,
		fetchContent: createDeprecatedFetchContentFn(),
		glob: createAstroGlobFn(),
		// INVESTIGATE is there a use-case for multi args?
		resolve(...segments: string[]) {
			let resolved = segments.reduce((u, segment) => new URL(segment, u), referenceURL).pathname;
			// When inside of project root, remove the leading path so you are
			// left with only `/src/images/tower.png`
			if (resolved.startsWith(projectRoot.pathname)) {
				resolved = '/' + resolved.slice(projectRoot.pathname.length);
			}
			return resolved;
		},
	};
}

const toAttributeString = (value: any, shouldEscape = true) =>
	shouldEscape ? String(value).replace(/&/g, '&#38;').replace(/"/g, '&#34;') : value;

const kebab = (k: string) =>
	k.toLowerCase() === k ? k : k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const toStyleString = (obj: Record<string, any>) =>
	Object.entries(obj)
		.map(([k, v]) => `${kebab(k)}:${v}`)
		.join(';');

const STATIC_DIRECTIVES = new Set(['set:html', 'set:text']);

// A helper used to turn expressions into attribute key/value
export function addAttribute(value: any, key: string, shouldEscape = true) {
	if (value == null) {
		return '';
	}

	if (value === false) {
		if (htmlEnumAttributes.test(key) || svgEnumAttributes.test(key)) {
			return markHTMLString(` ${key}="false"`);
		}
		return '';
	}

	// compiler directives cannot be applied dynamically, log a warning and ignore.
	if (STATIC_DIRECTIVES.has(key)) {
		// eslint-disable-next-line no-console
		console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`);
		return '';
	}

	// support "class" from an expression passed into an element (#782)
	if (key === 'class:list') {
		const listValue = toAttributeString(serializeListValue(value));
		if (listValue === '') {
			return '';
		}
		return markHTMLString(` ${key.slice(0, -5)}="${listValue}"`);
	}

	// support object styles for better JSX compat
	if (key === 'style' && !(value instanceof HTMLString) && typeof value === 'object') {
		return markHTMLString(` ${key}="${toStyleString(value)}"`);
	}

	// support `className` for better JSX compat
	if (key === 'className') {
		return markHTMLString(` class="${toAttributeString(value, shouldEscape)}"`);
	}

	// Boolean values only need the key
	if (value === true && (key.startsWith('data-') || htmlBooleanAttributes.test(key))) {
		return markHTMLString(` ${key}`);
	} else {
		return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
	}
}

// Adds support for `<Component {...value} />
function internalSpreadAttributes(values: Record<any, any>, shouldEscape = true) {
	let output = '';
	for (const [key, value] of Object.entries(values)) {
		output += addAttribute(value, key, shouldEscape);
	}
	return markHTMLString(output);
}

// Adds support for `<Component {...value} />
export function spreadAttributes(
	values: Record<any, any>,
	name?: string,
	{ class: scopedClassName }: { class?: string } = {}
) {
	let output = '';
	// If the compiler passes along a scoped class, merge with existing props or inject it
	if (scopedClassName) {
		if (typeof values.class !== 'undefined') {
			values.class += ` ${scopedClassName}`;
		} else if (typeof values['class:list'] !== 'undefined') {
			values['class:list'] = [values['class:list'], scopedClassName];
		} else {
			values.class = scopedClassName;
		}
	}
	for (const [key, value] of Object.entries(values)) {
		output += addAttribute(value, key, true);
	}
	return markHTMLString(output);
}

// Adds CSS variables to an inline style tag
export function defineStyleVars(defs: Record<any, any> | Record<any, any>[]) {
	let output = '';
	let arr = !Array.isArray(defs) ? [defs] : defs;
	for (const vars of arr) {
		for (const [key, value] of Object.entries(vars)) {
			if (value || value === 0) {
				output += `--${key}: ${value};`;
			}
		}
	}
	return markHTMLString(output);
}

// converts (most) arbitrary strings to valid JS identifiers
const toIdent = (k: string) =>
	k.trim().replace(/(?:(?<!^)\b\w|\s+|[^\w]+)/g, (match, index) => {
		if (/[^\w]|\s/.test(match)) return '';
		return index === 0 ? match : match.toUpperCase();
	});

// Adds variables to an inline script.
export function defineScriptVars(vars: Record<any, any>) {
	let output = '';
	for (const [key, value] of Object.entries(vars)) {
		output += `let ${toIdent(key)} = ${JSON.stringify(value)};\n`;
	}
	return markHTMLString(output);
}

function getHandlerFromModule(mod: EndpointHandler, method: string) {
	// If there was an exact match on `method`, return that function.
	if (mod[method]) {
		return mod[method];
	}
	// Handle `del` instead of `delete`, since `delete` is a reserved word in JS.
	if (method === 'delete' && mod['del']) {
		return mod['del'];
	}
	// If a single `all` handler was used, return that function.
	if (mod['all']) {
		return mod['all'];
	}
	// Otherwise, no handler found.
	return undefined;
}

/** Renders an endpoint request to completion, returning the body. */
export async function renderEndpoint(mod: EndpointHandler, request: Request, params: Params) {
	const chosenMethod = request.method?.toLowerCase();
	const handler = getHandlerFromModule(mod, chosenMethod);
	if (!handler || typeof handler !== 'function') {
		throw new Error(
			`Endpoint handler not found! Expected an exported function for "${chosenMethod}"`
		);
	}

	if (handler.length > 1) {
		// eslint-disable-next-line no-console
		console.warn(`
API routes with 2 arguments have been deprecated. Instead they take a single argument in the form of:

export function get({ params, request }) {
	//...
}

Update your code to remove this warning.`);
	}

	const context = {
		request,
		params,
	};

	const proxy = new Proxy(context, {
		get(target, prop) {
			if (prop in target) {
				return Reflect.get(target, prop);
			} else if (prop in params) {
				// eslint-disable-next-line no-console
				console.warn(`
API routes no longer pass params as the first argument. Instead an object containing a params property is provided in the form of:

export function get({ params }) {
	// ...
}

Update your code to remove this warning.`);
				return Reflect.get(params, prop);
			} else {
				return undefined;
			}
		},
	}) as APIContext & Params;

	return handler.call(mod, proxy, request);
}

// Calls a component and renders it into a string of HTML
export async function renderToString(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any
): Promise<string> {
	const Component = await componentFactory(result, props, children);

	if (!isAstroComponent(Component)) {
		const response: Response = Component;
		throw response;
	}

	let html = '';
	for await (const chunk of renderAstroComponent(Component)) {
		html += chunk;
	}
	return html;
}

export async function renderToIterable(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any
): Promise<AsyncIterable<string>> {
	const Component = await componentFactory(result, props, children);

	if (!isAstroComponent(Component)) {
		// eslint-disable-next-line no-console
		console.warn(
			`Returning a Response is only supported inside of page components. Consider refactoring this logic into something like a function that can be used in the page.`
		);
		const response: Response = Component;
		throw response;
	}

	return renderAstroComponent(Component);
}

const encoder = new TextEncoder();

export async function renderPage(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	streaming: boolean
): Promise<Response> {
	if (!componentFactory.isAstroComponentFactory) {
		const pageProps: Record<string, any> = { ...(props ?? {}), 'server:root': true };
		const output = await renderComponent(
			result,
			componentFactory.name,
			componentFactory,
			pageProps,
			null
		);
		let html = output.toString();
		if (!/<!doctype html/i.test(html)) {
			let rest = html;
			html = `<!DOCTYPE html>`;
			for await (let chunk of maybeRenderHead(result)) {
				html += chunk;
			}
			html += rest;
		}
		return new Response(html, {
			headers: new Headers([
				['Content-Type', 'text/html; charset=utf-8'],
				['Content-Length', Buffer.byteLength(html, 'utf-8').toString()],
			]),
		});
	}
	const factoryReturnValue = await componentFactory(result, props, children);

	if (isAstroComponent(factoryReturnValue)) {
		let iterable = renderAstroComponent(factoryReturnValue);
		let init = result.response;
		let headers = new Headers(init.headers);
		let body: BodyInit;
		if (streaming) {
			body = new ReadableStream({
				start(controller) {
					async function read() {
						let i = 0;
						try {
							for await (const chunk of iterable) {
								let html = chunk.toString();
								if (i === 0) {
									if (!/<!doctype html/i.test(html)) {
										controller.enqueue(encoder.encode('<!DOCTYPE html>\n'));
									}
								}
								controller.enqueue(encoder.encode(html));
								i++;
							}
							controller.close();
						} catch (e) {
							controller.error(e);
						}
					}
					read();
				},
			});
		} else {
			body = '';
			let i = 0;
			for await (const chunk of iterable) {
				let html = chunk.toString();
				if (i === 0) {
					if (!/<!doctype html/i.test(html)) {
						body += '<!DOCTYPE html>\n';
					}
				}
				body += chunk;
				i++;
			}
			const bytes = encoder.encode(body);
			headers.set('Content-Length', bytes.byteLength.toString());
		}

		let response = createResponse(body, { ...init, headers });
		return response;
	} else {
		return factoryReturnValue;
	}
}

// Filter out duplicate elements in our set
const uniqueElements = (item: any, index: number, all: any[]) => {
	const props = JSON.stringify(item.props);
	const children = item.children;
	return (
		index === all.findIndex((i) => JSON.stringify(i.props) === props && i.children == children)
	);
};

const alreadyHeadRenderedResults = new WeakSet<SSRResult>();
export function renderHead(result: SSRResult): Promise<string> {
	alreadyHeadRenderedResults.add(result);
	const styles = Array.from(result.styles)
		.filter(uniqueElements)
		.map((style) => renderElement('style', style));
	// Clear result.styles so that any new styles added will be inlined.
	result.styles.clear();
	const scripts = Array.from(result.scripts)
		.filter(uniqueElements)
		.map((script, i) => {
			return renderElement('script', script, false);
		});
	const links = Array.from(result.links)
		.filter(uniqueElements)
		.map((link) => renderElement('link', link, false));
	return markHTMLString(links.join('\n') + styles.join('\n') + scripts.join('\n'));
}

// This function is called by Astro components that do not contain a <head> component
// This accomodates the fact that using a <head> is optional in Astro, so this
// is called before a component's first non-head HTML element. If the head was
// already injected it is a noop.
export async function* maybeRenderHead(result: SSRResult): AsyncIterable<string> {
	if (alreadyHeadRenderedResults.has(result)) {
		return;
	}
	yield renderHead(result);
}

export async function* renderAstroComponent(
	component: InstanceType<typeof AstroComponent>
): AsyncIterable<string> {
	for await (const value of component) {
		if (value || value === 0) {
			for await (const chunk of _render(value)) {
				yield markHTMLString(chunk);
			}
		}
	}
}

function componentIsHTMLElement(Component: unknown) {
	return typeof HTMLElement !== 'undefined' && HTMLElement.isPrototypeOf(Component as object);
}

export async function renderHTMLElement(
	result: SSRResult,
	constructor: typeof HTMLElement,
	props: any,
	slots: any
) {
	const name = getHTMLElementName(constructor);

	let attrHTML = '';

	for (const attr in props) {
		attrHTML += ` ${attr}="${toAttributeString(await props[attr])}"`;
	}

	return markHTMLString(
		`<${name}${attrHTML}>${await renderSlot(result, slots?.default)}</${name}>`
	);
}

function getHTMLElementName(constructor: typeof HTMLElement) {
	const definedName = (
		customElements as CustomElementRegistry & { getName(_constructor: typeof HTMLElement): string }
	).getName(constructor);
	if (definedName) return definedName;

	const assignedName = constructor.name
		.replace(/^HTML|Element$/g, '')
		.replace(/[A-Z]/g, '-$&')
		.toLowerCase()
		.replace(/^-/, 'html-');
	return assignedName;
}

function renderElement(
	name: string,
	{ props: _props, children = '' }: SSRElement,
	shouldEscape = true
) {
	// Do not print `hoist`, `lang`, `is:global`
	const { lang: _, 'data-astro-id': astroId, 'define:vars': defineVars, ...props } = _props;
	if (defineVars) {
		if (name === 'style') {
			delete props['is:global'];
			delete props['is:scoped'];
		}
		if (name === 'script') {
			delete props.hoist;
			children = defineScriptVars(defineVars) + '\n' + children;
		}
	}
	if ((children == null || children == '') && voidElementNames.test(name)) {
		return `<${name}${internalSpreadAttributes(props, shouldEscape)} />`;
	}
	return `<${name}${internalSpreadAttributes(props, shouldEscape)}>${children}</${name}>`;
}
