import shorthash from 'shorthash';
import type { AstroComponentMetadata, AstroGlobalPartial, EndpointHandler, Params, SSRElement, SSRLoadedRenderer, SSRResult } from '../../@types/astro';
import { escapeHTML, HTMLString, markHTMLString } from './escape.js';
import { extractDirectives, generateHydrateScript, serializeProps } from './hydration.js';
import { serializeListValue } from './util.js';

export { markHTMLString, markHTMLString as unescapeHTML } from './escape.js';
export type { Metadata } from './metadata';
export { createMetadata } from './metadata.js';

const voidElementNames = /^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
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
async function _render(child: any): Promise<any> {
	child = await child;
	if (child instanceof HTMLString) {
		return child;
	} else if (Array.isArray(child)) {
		return markHTMLString((await Promise.all(child.map((value) => _render(value)))).join(''));
	} else if (typeof child === 'function') {
		// Special: If a child is a function, call it automatically.
		// This lets you do {() => ...} without the extra boilerplate
		// of wrapping it in a function and calling it.
		return _render(child());
	} else if (typeof child === 'string') {
		return markHTMLString(escapeHTML(child));
	} else if (!child && child !== 0) {
		// do nothing, safe to ignore falsey values.
	}
	// Add a comment explaining why each of these are needed.
	// Maybe create clearly named function for what this is doing.
	else if (child instanceof AstroComponent || Object.prototype.toString.call(child) === '[object AstroComponent]') {
		return markHTMLString(await renderAstroComponent(child));
	} else {
		return child;
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

	*[Symbol.iterator]() {
		const { htmlParts, expressions } = this;

		for (let i = 0; i < htmlParts.length; i++) {
			const html = htmlParts[i];
			const expression = expressions[i];

			yield markHTMLString(html);
			yield _render(expression);
		}
	}
}

function isAstroComponent(obj: any): obj is AstroComponent {
	return typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object AstroComponent]';
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

export async function renderSlot(_result: any, slotted: string, fallback?: any) {
	if (slotted) {
		return await _render(slotted);
	}
	return fallback;
}

export const Fragment = Symbol('Astro.Fragment');

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

export async function renderComponent(result: SSRResult, displayName: string, Component: unknown, _props: Record<string | number, any>, slots: any = {}) {
	Component = await Component;
	const children = await renderSlot(result, slots?.default);

	if (Component === Fragment) {
		if (children == null) {
			return children;
		}
		return markHTMLString(children);
	}

	if (Component && (Component as any).isAstroComponentFactory) {
		const output = await renderToString(result, Component as any, _props, slots);
		return markHTMLString(output);
	}

	if (Component === null && !_props['client:only']) {
		throw new Error(`Unable to render ${displayName} because it is ${Component}!\nDid you forget to import the component or is it possible there is a typo?`);
	}

	const { renderers } = result._metadata;
	const metadata: AstroComponentMetadata = { displayName };

	const { hydration, props } = extractDirectives(_props);
	let html = '';

	if (hydration) {
		metadata.hydrate = hydration.directive as AstroComponentMetadata['hydrate'];
		metadata.hydrateArgs = hydration.value;
		metadata.componentExport = hydration.componentExport;
		metadata.componentUrl = hydration.componentUrl;
	}
	const probableRendererNames = guessRenderers(metadata.componentUrl);

	if (Array.isArray(renderers) && renderers.length === 0 && typeof Component !== 'string' && !componentIsHTMLElement(Component)) {
		const message = `Unable to render ${metadata.displayName}!

There are no \`integrations\` set in your \`astro.config.mjs\` file.
Did you mean to add ${formatList(probableRendererNames.map((r) => '`' + r + '`'))}?`;
		throw new Error(message);
	}

	// Call the renderers `check` hook to see if any claim this component.
	let renderer: SSRLoadedRenderer | undefined;
	if (metadata.hydrate !== 'only') {
		for (const r of renderers) {
			if (await r.ssr.check(Component, props, children)) {
				renderer = r;
				break;
			}
		}

		if (!renderer && typeof HTMLElement === 'function' && componentIsHTMLElement(Component)) {
			const output = renderHTMLElement(result, Component as typeof HTMLElement, _props, slots);

			return output;
		}
	} else {
		// Attempt: use explicitly passed renderer name
		if (metadata.hydrateArgs) {
			const rendererName = metadata.hydrateArgs;
			renderer = renderers.filter(({ name }) => name === `@astrojs/${rendererName}` || name === rendererName)[0];
		}
		// Attempt: user only has a single renderer, default to that
		if (!renderer && renderers.length === 1) {
			renderer = renderers[0];
		}
		// Attempt: can we guess the renderer from the export extension?
		if (!renderer) {
			const extname = metadata.componentUrl?.split('.').pop();
			renderer = renderers.filter(({ name }) => name === `@astrojs/${extname}` || name === extname)[0];
		}
	}

	// If no one claimed the renderer
	if (!renderer) {
		if (metadata.hydrate === 'only') {
			// TODO: improve error message
			throw new Error(`Unable to render ${metadata.displayName}!

Using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.
Did you mean to pass <${metadata.displayName} client:only="${probableRendererNames.map((r) => r.replace('@astrojs/', '')).join('|')}" />
`);
		} else if (typeof Component !== 'string') {
			const matchingRenderers = renderers.filter((r) => probableRendererNames.includes(r.name));
			const plural = renderers.length > 1;
			if (matchingRenderers.length === 0) {
				throw new Error(`Unable to render ${metadata.displayName}!

There ${plural ? 'are' : 'is'} ${renderers.length} renderer${plural ? 's' : ''} configured in your \`astro.config.mjs\` file,
but ${plural ? 'none were' : 'it was not'} able to server-side render ${metadata.displayName}.

Did you mean to enable ${formatList(probableRendererNames.map((r) => '`' + r + '`'))}?`);
			} else if (matchingRenderers.length === 1) {
				// We already know that renderer.ssr.check() has failed
				// but this will throw a much more descriptive error!
				renderer = matchingRenderers[0];
				({ html } = await renderer.ssr.renderToStaticMarkup(Component, props, children));
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
			({ html } = await renderer.ssr.renderToStaticMarkup(Component, props, children));
		}
	}

	// This is a custom element without a renderer. Because of that, render it
	// as a string and the user is responsible for adding a script tag for the component definition.
	if (!html && typeof Component === 'string') {
		html = await renderAstroComponent(
			await render`<${Component}${spreadAttributes(props)}${markHTMLString(
				(children == null || children == '') && voidElementNames.test(Component) ? `/>` : `>${children}</${Component}>`
			)}`
		);
	}

	if (!hydration) {
		return markHTMLString(html.replace(/\<\/?astro-fragment\>/g, ''));
	}

	// Include componentExport name, componentUrl, and props in hash to dedupe identical islands
	const astroId = shorthash.unique(`<!--${metadata.componentExport!.value}:${metadata.componentUrl}-->\n${html}\n${serializeProps(props)}`);

	// Rather than appending this inline in the page, puts this into the `result.scripts` set that will be appended to the head.
	// INVESTIGATE: This will likely be a problem in streaming because the `<head>` will be gone at this point.
	result.scripts.add(await generateHydrateScript({ renderer: renderer!, result, astroId, props }, metadata as Required<AstroComponentMetadata>));

	// Render a template if no fragment is provided.
	const needsAstroTemplate = children && !/<\/?astro-fragment\>/.test(html);
	const template = needsAstroTemplate ? `<template data-astro-template>${children}</template>` : '';
	return markHTMLString(`<astro-root uid="${astroId}"${needsAstroTemplate ? ' tmpl' : ''}>${html ?? ''}${template}</astro-root>`);
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
export function createAstro(filePathname: string, _site: string, projectRootStr: string): AstroGlobalPartial {
	const site = new URL(_site);
	const url = new URL(filePathname, site);
	const projectRoot = new URL(projectRootStr);
	return {
		site,
		fetchContent: createDeprecatedFetchContentFn(),
		glob: createAstroGlobFn(),
		// INVESTIGATE is there a use-case for multi args?
		resolve(...segments: string[]) {
			let resolved = segments.reduce((u, segment) => new URL(segment, u), url).pathname;
			// When inside of project root, remove the leading path so you are
			// left with only `/src/images/tower.png`
			if (resolved.startsWith(projectRoot.pathname)) {
				resolved = '/' + resolved.substr(projectRoot.pathname.length);
			}
			return resolved;
		},
	};
}

const toAttributeString = (value: any, shouldEscape = true) => (shouldEscape ? String(value).replace(/&/g, '&#38;').replace(/"/g, '&#34;') : value);

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
		return markHTMLString(` ${key.slice(0, -5)}="${toAttributeString(serializeListValue(value))}"`);
	}

	// Boolean values only need the key
	if (value === true && (key.startsWith('data-') || htmlBooleanAttributes.test(key))) {
		return markHTMLString(` ${key}`);
	} else {
		return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
	}
}

// Adds support for `<Component {...value} />
export function spreadAttributes(values: Record<any, any>, shouldEscape = true) {
	let output = '';
	for (const [key, value] of Object.entries(values)) {
		output += addAttribute(value, key, shouldEscape);
	}
	return markHTMLString(output);
}

// Adds CSS variables to an inline style tag
export function defineStyleVars(selector: string, vars: Record<any, any>) {
	let output = '\n';
	for (const [key, value] of Object.entries(vars)) {
		output += `  --${key}: ${value};\n`;
	}
	return markHTMLString(`${selector} {${output}}`);
}

// Adds variables to an inline script.
export function defineScriptVars(vars: Record<any, any>) {
	let output = '';
	for (const [key, value] of Object.entries(vars)) {
		output += `let ${key} = ${JSON.stringify(value)};\n`;
	}
	return markHTMLString(output);
}

// Renders an endpoint request to completion, returning the body.
export async function renderEndpoint(mod: EndpointHandler, request: Request, params: Params) {
	const chosenMethod = request.method?.toLowerCase() ?? 'get';
	const handler = mod[chosenMethod];

	if (!handler || typeof handler !== 'function') {
		throw new Error(`Endpoint handler not found! Expected an exported function for "${chosenMethod}"`);
	}

	return await handler.call(mod, params, request);
}

async function replaceHeadInjection(result: SSRResult, html: string): Promise<string> {
	let template = html;
	// <!--astro:head--> injected by compiler
	// Must be handled at the end of the rendering process
	if (template.indexOf('<!--astro:head-->') > -1) {
		template = template.replace('<!--astro:head-->', await renderHead(result));
	}
	return template;
}

// Calls a component and renders it into a string of HTML
export async function renderToString(result: SSRResult, componentFactory: AstroComponentFactory, props: any, children: any): Promise<string> {
	const Component = await componentFactory(result, props, children);
	if (!isAstroComponent(Component)) {
		const response: Response = Component;
		throw response;
	}

	let template = await renderAstroComponent(Component);
	return replaceHeadInjection(result, template);
}

export async function renderPage(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any
): Promise<{ type: 'html'; html: string } | { type: 'response'; response: Response }> {
	try {
		const response = await componentFactory(result, props, children);

		if (isAstroComponent(response)) {
			let template = await renderAstroComponent(response);
			const html = await replaceHeadInjection(result, template);
			return {
				type: 'html',
				html,
			};
		} else {
			return {
				type: 'response',
				response,
			};
		}
	} catch(err) {
		if(err instanceof Response) {
			return {
				type: 'response',
				response: err
			};
		} else {
			throw err;
		}
	}
}

// Filter out duplicate elements in our set
const uniqueElements = (item: any, index: number, all: any[]) => {
	const props = JSON.stringify(item.props);
	const children = item.children;
	return index === all.findIndex((i) => JSON.stringify(i.props) === props && i.children == children);
};

// Renders a page to completion by first calling the factory callback, waiting for its result, and then appending
// styles and scripts into the head.
export async function renderHead(result: SSRResult): Promise<string> {
	const styles = Array.from(result.styles)
		.filter(uniqueElements)
		.map((style) => {
			const styleChildren = !result._metadata.legacyBuild ? '' : style.children;
			return renderElement('style', {
				children: styleChildren,
				props: { ...style.props, 'astro-style': true },
			});
		});
	let needsHydrationStyles = false;
	const scripts = Array.from(result.scripts)
		.filter(uniqueElements)
		.map((script, i) => {
			if ('data-astro-component-hydration' in script.props) {
				needsHydrationStyles = true;
			}
			return renderElement('script', {
				...script,
				props: { ...script.props, 'astro-script': result._metadata.pathname + '/script-' + i },
			});
		});
	if (needsHydrationStyles) {
		styles.push(renderElement('style', { props: { 'astro-style': true }, children: 'astro-root, astro-fragment { display: contents; }' }));
	}
	const links = Array.from(result.links)
		.filter(uniqueElements)
		.map((link) => renderElement('link', link, false));
	return markHTMLString(links.join('\n') + styles.join('\n') + scripts.join('\n') + '\n' + '<!--astro:head:injected-->');
}

export async function renderAstroComponent(component: InstanceType<typeof AstroComponent>) {
	let template = [];

	for await (const value of component) {
		if (value || value === 0) {
			template.push(value);
		}
	}

	return markHTMLString(await _render(template));
}

function componentIsHTMLElement(Component: unknown) {
	return typeof HTMLElement !== 'undefined' && HTMLElement.isPrototypeOf(Component as object);
}

export async function renderHTMLElement(result: SSRResult, constructor: typeof HTMLElement, props: any, slots: any) {
	const name = getHTMLElementName(constructor);

	let attrHTML = '';

	for (const attr in props) {
		attrHTML += ` ${attr}="${toAttributeString(await props[attr])}"`;
	}

	return markHTMLString(`<${name}${attrHTML}>${await renderSlot(result, slots?.default)}</${name}>`);
}

function getHTMLElementName(constructor: typeof HTMLElement) {
	const definedName = (customElements as CustomElementRegistry & { getName(_constructor: typeof HTMLElement): string }).getName(constructor);
	if (definedName) return definedName;

	const assignedName = constructor.name
		.replace(/^HTML|Element$/g, '')
		.replace(/[A-Z]/g, '-$&')
		.toLowerCase()
		.replace(/^-/, 'html-');
	return assignedName;
}

function renderElement(name: string, { props: _props, children = '' }: SSRElement, shouldEscape = true) {
	// Do not print `hoist`, `lang`, `global`
	const { lang: _, 'data-astro-id': astroId, 'define:vars': defineVars, ...props } = _props;
	if (defineVars) {
		if (name === 'style') {
			if (props.global) {
				children = defineStyleVars(`:root`, defineVars) + '\n' + children;
			} else {
				children = defineStyleVars(`.astro-${astroId}`, defineVars) + '\n' + children;
			}
			delete props.global;
		}
		if (name === 'script') {
			delete props.hoist;
			children = defineScriptVars(defineVars) + '\n' + children;
		}
	}
	return `<${name}${spreadAttributes(props, shouldEscape)}>${children}</${name}>`;
}
