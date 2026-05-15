import { type CompileProps, type CompileResult } from '../core/compile/index.js';
import type { AstroLogger } from '../core/logger/core.js';
import type { CompileMetadata } from './types.js';
import type { SourceMapInput } from 'rollup';
interface CompileAstroOption {
	compileProps: CompileProps;
	astroFileToCompileMetadata: Map<string, CompileMetadata>;
	logger: AstroLogger;
}
export interface CompileAstroResult extends Omit<CompileResult, 'map'> {
	map: SourceMapInput;
}
export declare function compileAstro({
	compileProps,
	astroFileToCompileMetadata,
	logger,
}: CompileAstroOption): Promise<CompileAstroResult>;
export {};
