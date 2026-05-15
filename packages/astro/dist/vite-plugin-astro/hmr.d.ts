import type { HmrContext } from 'vite';
import type { AstroLogger } from '../core/logger/core.js';
import type { CompileAstroResult } from './compile.js';
import type { CompileMetadata } from './types.js';
interface HandleHotUpdateOptions {
	logger: AstroLogger;
	compile: (code: string, filename: string) => Promise<CompileAstroResult>;
	astroFileToCompileMetadata: Map<string, CompileMetadata>;
}
export declare function handleHotUpdate(
	ctx: HmrContext,
	{ logger, compile, astroFileToCompileMetadata }: HandleHotUpdateOptions,
): Promise<import('vite').ModuleNode[] | undefined>;
export declare function isStyleOnlyChanged(oldCode: string, newCode: string): boolean;
export {};
