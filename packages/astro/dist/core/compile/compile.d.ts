import type { TransformResult } from '@astrojs/compiler';
import type { ResolvedConfig } from 'vite';
import type { AstroConfig } from '../../types/public/config.js';
import type { CompileCssResult } from './types.js';
export interface CompileProps {
	astroConfig: AstroConfig;
	viteConfig: ResolvedConfig;
	toolbarEnabled: boolean;
	filename: string;
	source: string;
}
export interface CompileResult extends Omit<TransformResult, 'css'> {
	css: CompileCssResult[];
}
export declare function compile({
	astroConfig,
	viteConfig,
	toolbarEnabled,
	filename,
	source,
}: CompileProps): Promise<CompileResult>;
