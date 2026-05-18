import { cssFitValues } from '../internal.js';

// Standard CSS object-position keyword values.
// These cover the vast majority of real-world usage and are emitted as
// data-attribute-driven CSS rules so that no inline styles are needed (CSP-safe).
const POSITION_KEYWORDS = ['top', 'bottom', 'left', 'right', 'center'];

/**
 * Builds every 1- and 2-keyword combination of object-position values:
 * center, top, bottom, left, right, top left, top center, top right, etc.
 * Returns entries as `[dataAttrValue, cssValue]` pairs where the data-attr
 * value has spaces replaced with dashes (matching the normalisation in internal.ts).
 */
function getPositionEntries(): Array<[dataAttr: string, cssValue: string]> {
	const entries: Array<[string, string]> = [];

	// Single-keyword values
	for (const kw of POSITION_KEYWORDS) {
		entries.push([kw, kw]);
	}

	// Two-keyword combinations
	for (const a of POSITION_KEYWORDS) {
		for (const b of POSITION_KEYWORDS) {
			if (a === b) continue;
			const cssValue = `${a} ${b}`;
			const dataAttr = `${a}-${b}`;
			entries.push([dataAttr, cssValue]);
		}
	}

	return entries;
}

export function generateImageStylesCSS(
	defaultObjectFit?: string,
	defaultObjectPosition?: string,
): string {
	const fitStyles = cssFitValues
		.map(
			(fit) => `
[data-astro-image-fit="${fit}"] {
  object-fit: ${fit};
}`,
		)
		.join('\n');

	const defaultFitStyle =
		defaultObjectFit && cssFitValues.includes(defaultObjectFit)
			? `
:where([data-astro-image]:not([data-astro-image-fit])) {
  object-fit: ${defaultObjectFit};
}`
			: '';

	// Generate rules for all standard object-position keyword combinations.
	// This avoids inline styles entirely, keeping everything CSP-compliant.
	const positionEntries = getPositionEntries();
	const positionStyles = positionEntries
		.map(
			([dataAttr, cssValue]) => `
[data-astro-image-pos="${dataAttr}"] {
  object-position: ${cssValue};
}`,
		)
		.join('\n');

	const defaultPositionStyle = defaultObjectPosition
		? `
:where([data-astro-image]:not([data-astro-image-pos])) {
  object-position: ${defaultObjectPosition};
}`
		: '';

	return `
:where([data-astro-image]) {
  height: auto;
}
:where([data-astro-image="full-width"]) {
  width: 100%;
}
:where([data-astro-image="constrained"]) {
  max-width: 100%;
}
${fitStyles}
${defaultFitStyle}
${positionStyles}
${defaultPositionStyle}
`.trim();
}
