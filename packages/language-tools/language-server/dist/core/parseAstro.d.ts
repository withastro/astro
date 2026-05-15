import type { ParseOptions, ParseResult, Point } from '@astrojs/compiler/types';
import type { LSPTSXRanges } from './astro2tsx.js';
export type AstroMetadata = ParseResult & {
	frontmatter: FrontmatterStatus;
	tsxRanges: LSPTSXRanges;
};
export declare function getAstroMetadata(
	fileName: string,
	input: string,
	options?: ParseOptions,
): Omit<AstroMetadata, 'tsxRanges'>;
interface FrontmatterOpen {
	status: 'open';
	position: {
		start: Point;
		end: undefined;
	};
}
interface FrontmatterClosed {
	status: 'closed';
	position: {
		start: Point;
		end: Point;
	};
}
interface FrontmatterNull {
	status: 'doesnt-exist';
	position: undefined;
}
export type FrontmatterStatus = FrontmatterOpen | FrontmatterClosed | FrontmatterNull;
export {};
