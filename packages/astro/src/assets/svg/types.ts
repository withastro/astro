export interface SvgOptimizer {
	name: string;
	optimize: (contents: string) => string | Promise<string>;
}
