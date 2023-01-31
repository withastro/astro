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
