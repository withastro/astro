import type { SourceMapInput } from 'rollup';
import { type CompileProps, type CompileResult } from '../core/compile/compile-rs.js';
import type { CompileMetadata } from './types.js';
interface CompileAstroOption {
	compileProps: CompileProps;
	astroFileToCompileMetadata: Map<string, CompileMetadata>;
}
export interface CompileAstroResult extends Omit<CompileResult, 'map'> {
	map: SourceMapInput;
}
export declare function compileAstro({
	compileProps,
	astroFileToCompileMetadata,
}: CompileAstroOption): Promise<CompileAstroResult>;
export {};
