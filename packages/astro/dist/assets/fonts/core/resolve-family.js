import { dedupe, withoutQuotes } from '../utils.js';
function resolveFamily({ family, hasher }) {
	const name = withoutQuotes(family.name);
	return {
		...family,
		name,
		// This will be used in CSS font faces. Quotes are added by the CSS renderer if
		// this value contains a space.
		uniqueName: `${name}-${hasher.hashObject(family)}`,
		weights: family.weights ? dedupe(family.weights.map((weight) => weight.toString())) : void 0,
		styles: family.styles ? dedupe(family.styles) : void 0,
		subsets: family.subsets ? dedupe(family.subsets) : void 0,
		formats: family.formats ? dedupe(family.formats) : void 0,
		fallbacks: family.fallbacks ? dedupe(family.fallbacks) : void 0,
		unicodeRange: family.unicodeRange ? dedupe(family.unicodeRange) : void 0,
	};
}
export { resolveFamily };
