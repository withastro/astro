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
export interface CompileResult {
	code: string;
	map: string;
	scope: string;
	css: CompileCssResult[];
	scripts: any[];
	hydratedComponents: any[];
	clientOnlyComponents: any[];
	serverComponents: any[];
	containsHead: boolean;
	propagation: boolean;
	styleError: string[];
	diagnostics: any[];
}
export declare function compile({
	astroConfig,
	viteConfig,
	toolbarEnabled,
	filename,
	source,
}: CompileProps): Promise<CompileResult>;
