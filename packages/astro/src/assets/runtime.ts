import { encodeBase64 } from '@oslojs/encoding';
import { ALGORITHMS } from '../core/csp/config.js';
import type { SSRResult } from '../types/public/internal.js';
import {
	createComponent,
	render,
	spreadAttributes,
	unescapeHTML,
} from '../runtime/server/index.js';
import type { ImageMetadata } from './types.js';

export interface SvgComponentProps {
	meta: ImageMetadata;
	attributes: Record<string, string>;
	children: string;
	/** Text content of any `<style>` elements embedded in the SVG */
	styles?: string[];
}

const encoder = new TextEncoder();

/**
 * Compute a CSP hash for the given text using the Web Crypto API.
 * Uses the same format as `generateCspDigest` in core/encryption.ts
 * but avoids importing from that module to prevent pulling in Node.js-specific code.
 */
async function hashForCsp(
	content: string,
	algorithm: NonNullable<SSRResult['cspAlgorithm']>,
): Promise<string> {
	const hashBuffer = await crypto.subtle.digest(algorithm, encoder.encode(content));
	const hash = encodeBase64(new Uint8Array(hashBuffer));
	return `${ALGORITHMS[algorithm]}${hash}`;
}

export function createSvgComponent({ meta, attributes, children, styles }: SvgComponentProps) {
	const Component = createComponent(async (result: SSRResult, props) => {
		// When CSP is enabled, hash any embedded SVG <style> contents
		// and register them so the CSP policy includes them.
		if (styles && styles.length > 0 && result.shouldInjectCspMetaTags && result.cspAlgorithm) {
			for (const style of styles) {
				const hash = await hashForCsp(style, result.cspAlgorithm);
				if (!result._metadata.extraStyleHashes.includes(hash)) {
					result._metadata.extraStyleHashes.push(hash);
				}
			}
		}

		const normalizedProps = normalizeProps(attributes, props);

		return render`<svg${spreadAttributes(normalizedProps)}>${unescapeHTML(children)}</svg>`;
	});

	if (import.meta.env.DEV) {
		// Prevent revealing that this is a component
		makeNonEnumerable(Component);

		// Maintaining the current `console.log` output for SVG imports
		Object.defineProperty(Component, Symbol.for('nodejs.util.inspect.custom'), {
			value: (_: any, opts: any, inspect: any) => inspect(meta, opts),
		});
	}

	Object.defineProperty(Component, 'toJSON', {
		value: () => meta,
		enumerable: false,
	});

	// Attaching the metadata to the component to maintain current functionality
	return Object.assign(Component, meta);
}

type SvgAttributes = Record<string, any>;

/**
 * Some attributes required for `image/svg+xml` are irrelevant when inlined in a `text/html` document. We can save a few bytes by dropping them.
 */
const ATTRS_TO_DROP = ['xmlns', 'xmlns:xlink', 'version'];
const DEFAULT_ATTRS: SvgAttributes = {};

export function dropAttributes(attributes: SvgAttributes) {
	for (const attr of ATTRS_TO_DROP) {
		delete attributes[attr];
	}

	return attributes;
}

function normalizeProps(attributes: SvgAttributes, props: SvgAttributes) {
	return dropAttributes({ ...DEFAULT_ATTRS, ...attributes, ...props });
}

function makeNonEnumerable(object: Record<string, any>) {
	for (const property in object) {
		Object.defineProperty(object, property, { enumerable: false });
	}
}
