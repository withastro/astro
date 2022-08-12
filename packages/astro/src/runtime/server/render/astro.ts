import type { SSRRenderInstruction, SSRResult } from '../../../@types/astro';
import type { AstroComponentFactory } from './index';

import { markHTMLString } from '../escape.js';
import { HydrationDirectiveProps } from '../hydration.js';
import { renderChild } from './any.js';
import { stringifyChunk } from './common.js';

// In dev mode, check props and make sure they are valid for an Astro component
function validateComponentProps(props: any, displayName: string) {
	if (import.meta.env?.DEV && props != null) {
		for (const prop of Object.keys(props)) {
			if (HydrationDirectiveProps.has(prop)) {
				// eslint-disable-next-line
				console.warn(
					`You are attempting to render <${displayName} ${prop} />, but ${displayName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`
				);
			}
		}
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
			yield* renderChild(expression);
		}
	}
}

// Determines if a component is an .astro component
export function isAstroComponent(obj: any): obj is AstroComponent {
	return (
		typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object AstroComponent]'
	);
}

export async function* renderAstroComponent(
	component: InstanceType<typeof AstroComponent>
): AsyncIterable<string | SSRRenderInstruction> {
	for await (const value of component) {
		if (value || value === 0) {
			for await (const chunk of renderChild(value)) {
				switch (chunk.type) {
					case 'directive': {
						yield chunk;
						break;
					}
					default: {
						yield markHTMLString(chunk);
						break;
					}
				}
			}
		}
	}
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
		html += stringifyChunk(result, chunk);
	}
	return html;
}

export async function renderToIterable(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	displayName: string,
	props: any,
	children: any
): Promise<AsyncIterable<string | SSRRenderInstruction>> {
	validateComponentProps(props, displayName);
	const Component = await componentFactory(result, props, children);

	if (!isAstroComponent(Component)) {
		// eslint-disable-next-line no-console
		console.warn(
			`Returning a Response is only supported inside of page components. Consider refactoring this logic into something like a function that can be used in the page.`
		);

		const response = Component;
		throw response;
	}

	return renderAstroComponent(Component);
}

export async function renderTemplate(htmlParts: TemplateStringsArray, ...expressions: any[]) {
	return new AstroComponent(htmlParts, expressions);
}
