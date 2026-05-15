import type { MdxOptions } from './index.js';
interface MdxProcessorExtraOptions {
	sourcemap: boolean;
}
export declare function createMdxProcessor(
	mdxOptions: MdxOptions,
	extraOptions: MdxProcessorExtraOptions,
): import('unified').Processor<
	import('mdast').Root,
	import('estree').Program,
	import('estree').Program,
	import('estree').Program,
	string
>;
export {};
