import type { SSRResult } from '../../../types/public/internal.js';
import { markHTMLString } from '../escape.js';
import { renderCspContent } from './csp.js';
import type { MaybeRenderHeadInstruction, RenderHeadInstruction } from './instruction.js';
import { createRenderInstruction } from './instruction.js';
import { renderElement } from './util.js';

// Deterministic stringification of props that is key-order independent,
// so elements with the same props in different insertion order are still deduped.
function stablePropsKey(props: Record<string, unknown>): string {
	const keys = Object.keys(props).sort();
	let result = '{';
	for (let i = 0; i < keys.length; i++) {
		if (i > 0) result += ',';
		result += JSON.stringify(keys[i]) + ':' + JSON.stringify(props[keys[i]]);
	}
	result += '}';
	return result;
}

// Filter out duplicate elements using a Set for O(N) instead of O(N²)
function deduplicateElements(elements: any[]): any[] {
	if (elements.length <= 1) return elements;
	const seen = new Set<string>();
	return elements.filter((item) => {
		const key = stablePropsKey(item.props) + item.children;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

export function renderAllHeadContent(result: SSRResult) {
	result._metadata.hasRenderedHead = true;
	let content = '';
	if (result.shouldInjectCspMetaTags && result.cspDestination === 'meta') {
		content += renderElement(
			'meta',
			{
				props: {
					'http-equiv': 'content-security-policy',
					content: renderCspContent(result),
				},
				children: '',
			},
			false,
		);
	}
	const styles = deduplicateElements(Array.from(result.styles)).map((style) =>
		style.props.rel === 'stylesheet' ? renderElement('link', style) : renderElement('style', style),
	);
	// Clear result.styles so that any new styles added will be inlined.
	result.styles.clear();
	const scripts = deduplicateElements(Array.from(result.scripts)).map((script) => {
		if (result.userAssetsBase) {
			script.props.src =
				(result.base === '/' ? '' : result.base) + result.userAssetsBase + script.props.src;
		}
		return renderElement('script', script, false);
	});
	const links = deduplicateElements(Array.from(result.links)).map((link) =>
		renderElement('link', link, false),
	);

	// Order styles -> links -> scripts similar to src/content/runtime.ts
	// The order is usually fine as the ordering between these groups are mutually exclusive,
	// except for CSS styles and CSS stylesheet links. However CSS stylesheet links usually
	// consist of CSS modules which should naturally take precedence over CSS styles, so the
	// order will still work. In prod, all CSS are stylesheet links.
	// In the future, it may be better to have only an array of head elements to avoid these assumptions.
	content += styles.join('\n') + links.join('\n') + scripts.join('\n');

	if (result._metadata.extraHead.length > 0) {
		for (const part of result._metadata.extraHead) {
			content += part;
		}
	}

	return markHTMLString(content);
}

export function renderHead(): RenderHeadInstruction {
	return createRenderInstruction({ type: 'head' });
}

// This function is called by Astro components that do not contain a <head> component
// This accommodates the fact that using a <head> is optional in Astro, so this
// is called before a component's first non-head HTML element. If the head was
// already injected it is a noop.
export function maybeRenderHead(): MaybeRenderHeadInstruction {
	// This is an instruction informing the page rendering that head might need rendering.
	// This allows the page to deduplicate head injections.
	return createRenderInstruction({ type: 'maybe-head' });
}
