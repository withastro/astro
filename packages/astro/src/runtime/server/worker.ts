import { escapeHTML, UnescapedString, unescapeHTML } from './escape.js';
export { escapeHTML, unescapeHTML } from './escape.js';

export const createMetadata = () => ({});
export const createComponent = (fn: any) => fn;

async function _render(child: any): Promise<any> {
	child = await child;
	if (child instanceof UnescapedString) {
		return child;
	} else if (Array.isArray(child)) {
		return unescapeHTML((await Promise.all(child.map((value) => _render(value)))).join(''));
	} else if (typeof child === 'function') {
		// Special: If a child is a function, call it automatically.
		// This lets you do {() => ...} without the extra boilerplate
		// of wrapping it in a function and calling it.
		return _render(child());
	} else if (typeof child === 'string') {
		return escapeHTML(child, { deprecated: true });
	} else if (!child && child !== 0) {
		// do nothing, safe to ignore falsey values.
	}
	// Add a comment explaining why each of these are needed.
	// Maybe create clearly named function for what this is doing.
	else if (child instanceof AstroComponent || Object.prototype.toString.call(child) === '[object AstroComponent]') {
		return unescapeHTML(await renderAstroComponent(child));
	} else {
		return child;
	}
}

// This is used to create the top-level Astro global; the one that you can use
// Inside of getStaticPaths.
export function createAstro(filePathname: string, _site: string, projectRootStr: string): AstroGlobalPartial {
	const site = new URL(_site);
	const url = new URL(filePathname, site);
	const projectRoot = new URL(projectRootStr);
	const fetchContent = () => {};
	return {
		site,
		fetchContent,
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

export async function renderAstroComponent(component: InstanceType<typeof AstroComponent>) {
	let template = [];

	for await (const value of component) {
		if (value || value === 0) {
			template.push(value);
		}
	}

	return unescapeHTML(await _render(template));
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

			yield _render(unescapeHTML(html));
			yield _render(expression);
		}
	}
}

export async function render(htmlParts: TemplateStringsArray, ...expressions: any[]) {
	return new AstroComponent(htmlParts, expressions);
}

// Calls a component and renders it into a string of HTML
export async function renderToString(result: any, componentFactory: any, props: any, children: any) {
	const Component = await componentFactory(result, props, children);
	let template = await renderAstroComponent(Component);
	return unescapeHTML(template);
}
