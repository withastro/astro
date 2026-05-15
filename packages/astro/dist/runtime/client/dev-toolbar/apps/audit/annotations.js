const ELEMENT_ANNOTATIONS = /* @__PURE__ */ new WeakMap();
function getAnnotationsForElement(element) {
	return ELEMENT_ANNOTATIONS.get(element);
}
const ANNOTATION_MAP = {
	'data-astro-source-file': 'file',
	'data-astro-source-loc': 'location',
};
function extractAnnotations(element) {
	const annotations = {};
	for (const [attr, key] of Object.entries(ANNOTATION_MAP)) {
		annotations[key] = element.getAttribute(attr);
	}
	for (const attr of Object.keys(ANNOTATION_MAP)) {
		element.removeAttribute(attr);
	}
	return annotations;
}
function processAnnotations() {
	for (const element of document.querySelectorAll(`[data-astro-source-file]`)) {
		ELEMENT_ANNOTATIONS.set(element, extractAnnotations(element));
	}
}
export { getAnnotationsForElement, processAnnotations };
