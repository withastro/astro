export interface Annotation {
	file: string;
	location: string;
}
export declare function getAnnotationsForElement(element: Element): Annotation | undefined;
export declare function processAnnotations(): void;
