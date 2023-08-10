import type { SSRResult } from '../../../@types/astro';

import { markHTMLString } from '../escape.js';
import type { MaybeRenderHeadInstruction, RenderHeadInstruction } from './types';
import { renderElement } from './util.js';

// Filter out duplicate elements in our set
const uniqueElements = (item: any, index: number, all: any[]) => {
	const props = JSON.stringify(item.props);
	const children = item.children;
	return (
		index === all.findIndex((i) => JSON.stringify(i.props) === props && i.children == children)
	);
};

export function renderAllHeadContent(result: SSRResult) {
	result._metadata.hasRenderedHead = true;
	const styles = Array.from(result.styles)
		.filter(uniqueElements)
		.map((style) =>
			style.props.rel === 'stylesheet'
				? renderElement('link', style)
				: renderElement('style', style)
		);
	// Clear result.styles so that any new styles added will be inlined.
	result.styles.clear();
	const scripts = Array.from(result.scripts)
		.filter(uniqueElements)
		.map((script) => {
			return renderElement('script', script, false);
		});
	const links = Array.from(result.links)
		.filter(uniqueElements)
		.map((link) => renderElement('link', link, false));

	let content = links.join('\n') + styles.join('\n') + scripts.join('\n');

	if (result._metadata.extraHead.length > 0) {
		for (const part of result._metadata.extraHead) {
			content += part;
		}
	}

	return markHTMLString(content);
}

export function* renderHead(): Generator<RenderHeadInstruction> {
	yield { type: 'head' };
}

// This function is called by Astro components that do not contain a <head> component
// This accommodates the fact that using a <head> is optional in Astro, so this
// is called before a component's first non-head HTML element. If the head was
// already injected it is a noop.
export function* maybeRenderHead(): Generator<MaybeRenderHeadInstruction> {
	// This is an instruction informing the page rendering that head might need rendering.
	// This allows the page to deduplicate head injections.
	yield { type: 'maybe-head' };
}
