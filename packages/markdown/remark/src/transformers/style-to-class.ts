/**
 * Copied and adapted from https://github.com/shikijs/shiki/blob/main/packages/transformers/src/transformers/style-to-class.ts
 */

import type { ShikiTransformer } from 'shiki';

export interface ShikiTransformerStyleToClass extends ShikiTransformer {
	getClassRegistry: () => Map<string, Record<string, string> | string>;
	getCSS: () => string;
	clearRegistry: () => void;
}

/**
 * Transform Shiki inline styles to CSS classes.
 * Based on @shikijs/transformers style-to-class transformer.
 *
 * This transformer extracts inline styles from Shiki-generated HTML and converts them
 * to unique class names, allowing CSS to be collected and bundled separately for better
 * performance and CSP compliance.
 */
export function transformerStyleToClass(): ShikiTransformerStyleToClass {
	const classToStyle = new Map<string, Record<string, string> | string>();

	function stringifyStyle(style: Record<string, string>): string {
		return Object.entries(style)
			.map(([key, value]) => `${key}:${value}`)
			.join(';');
	}

	function registerStyle(style: Record<string, string> | string): string {
		const str = typeof style === 'string' ? style : stringifyStyle(style);
		let className = '__a_' + cyrb53(str);
		if (!classToStyle.has(className)) {
			classToStyle.set(className, typeof style === 'string' ? style : { ...style });
		}
		return className;
	}

	return {
		name: '@astrojs/markdown-remark:style-to-class',
		pre(node) {
			if (!node.properties.style) return;

			const className = registerStyle(node.properties.style as string);
			delete node.properties.style;
			this.addClassToHast(node, className);
		},
		tokens(lines) {
			for (const line of lines) {
				for (const token of line) {
					let className: string;
					if (token.htmlStyle) {
						className = registerStyle(token.htmlStyle);
						token.htmlStyle = {};
					} else {
						className = registerStyle({ color: token.color } as Record<string, string>);
						token.color = '';
					}
					token.htmlAttrs ||= {};
					if (!token.htmlAttrs.class) {
						token.htmlAttrs.class = className;
					} else {
						token.htmlAttrs.class += ` ${className}`;
					}
				}
			}
		},
		getClassRegistry() {
			return classToStyle;
		},
		getCSS() {
			// Start with base utility classes for code block behavior
			let css = '.astro-code-overflow{overflow-x:auto}';
			css += '.astro-code-wrap{white-space:pre-wrap;word-wrap:break-word}';
			css += '.astro-code-no-select{user-select:none}';

			// Add token-specific styles
			for (const [className, style] of classToStyle.entries()) {
				css += `.${className}{${typeof style === 'string' ? style : stringifyStyle(style)}}`;
			}
			return css;
		},
		clearRegistry() {
			classToStyle.clear();
		},
	};
}

/**
 * A simple hash function for generating unique class names.
 * @see https://stackoverflow.com/a/52171480
 */
function cyrb53(str: string, seed = 0): string {
	let h1 = 0xdeadbeef ^ seed;
	let h2 = 0x41c6ce57 ^ seed;
	for (let i = 0, ch; i < str.length; i++) {
		ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
	h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
	h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36).slice(0, 6);
}
