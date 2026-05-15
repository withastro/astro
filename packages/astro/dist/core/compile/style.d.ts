import { type ResolvedConfig } from 'vite';
import type { AstroConfig } from '../../types/public/config.js';
import type { CompileCssResult } from './types.js';
export type PartialCompileCssResult = Pick<CompileCssResult, 'isGlobal' | 'dependencies'>;
interface PreprocessorResult {
	code: string;
	map?: string;
}
interface PreprocessorError {
	error: string;
}
export type PreprocessStyleFn = (
	content: string,
	attrs: Record<string, string>,
) => Promise<PreprocessorResult | PreprocessorError>;
export declare function createStylePreprocessor({
	filename,
	viteConfig,
	astroConfig,
	cssPartialCompileResults,
	cssTransformErrors,
}: {
	filename: string;
	viteConfig: ResolvedConfig;
	astroConfig: AstroConfig;
	cssPartialCompileResults: Partial<CompileCssResult>[];
	cssTransformErrors: Error[];
}): PreprocessStyleFn;
export {};
