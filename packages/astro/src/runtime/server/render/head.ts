import type { SSRResult } from '../../../@types/astro';

import { markHTMLString } from '../escape.js';
import { renderElement } from './util.js';

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
