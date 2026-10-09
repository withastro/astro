export interface SvgOptimizer {
	name: string;
	optimize: (contents: string, path: string) => string | Promise<string>;
}
