export interface Annotation {
	file: string;
	location: string;
}
const ELEMENT_ANNOTATIONS = new WeakMap<Element, Annotation>();
export function getAnnotationsForElement(element: Element) {
	return ELEMENT_ANNOTATIONS.get(element);
}

const ANNOTATION_MAP: Record<string, keyof Annotation> = {
	'data-astro-source-file': 'file',
	'data-astro-source-loc': 'location',
};
function extractAnnotations(element: Element) {
	const annotations: Annotation = {} as any;
	for (const [attr, key] of Object.entries(ANNOTATION_MAP) as [string, keyof Annotation][]) {
		annotations[key] = element.getAttribute(attr)!;
	}
	for (const attr of Object.keys(ANNOTATION_MAP)) {
		element.removeAttribute(attr);
	}
	return annotations;
}

export function processAnnotations() {
	for (const element of document.querySelectorAll(`[data-astro-source-file]`)) {
		ELEMENT_ANNOTATIONS.set(element, extractAnnotations(element));
	}
}
