import type { SourceMap } from 'rollup';

export type TransformStyleResult = null | {
	code: string;
	map: SourceMap | null;
	deps: Set<string>;
};

export type TransformStyle = (
	source: string,
	lang: string
) => TransformStyleResult | Promise<TransformStyleResult>;

export interface CompileCssResult {
	code: string;
	/**
	 * Whether this is `<style is:global>`
	 */
	isGlobal: boolean;
	/**
	 * The dependencies of the transformed CSS (Normalized/forward-slash-only absolute paths)
	 */
	dependencies: string[];
}
