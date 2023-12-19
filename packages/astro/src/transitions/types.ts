export type Fallback = 'none' | 'animate' | 'swap';
export type Direction = 'forward' | 'back';
export type NavigationTypeString = 'push' | 'replace' | 'traverse';
export type Options = {
	history?: 'auto' | 'push' | 'replace';
	info?: any;
	state?: any;
	body?: FormData | URLSearchParams;
	sourceElement?: Element; // more than HTMLElement, e.g. SVGAElement
};
