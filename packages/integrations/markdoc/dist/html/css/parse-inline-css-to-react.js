import { styleToObject } from './style-to-object.js';
function parseInlineCSSToReactLikeObject(css) {
	if (typeof css === 'string') {
		const cssObject = {};
		styleToObject(css, (originalCssDirective, value) => {
			const reactCssDirective = convertCssDirectiveNameToReactCamelCase(originalCssDirective);
			cssObject[reactCssDirective] = value;
		});
		return cssObject;
	}
	return void 0;
}
function convertCssDirectiveNameToReactCamelCase(original) {
	const replaced = original.replace(/-([a-z\d])/gi, (_match, char) => {
		return char.toUpperCase();
	});
	return replaced;
}
export { parseInlineCSSToReactLikeObject };
