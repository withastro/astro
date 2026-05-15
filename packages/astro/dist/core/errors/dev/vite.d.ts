import type { ErrorPayload } from 'vite';
import type { SSRLoadedRenderer } from '../../../types/public/internal.js';
import type { ModuleLoader } from '../../module-loader/index.js';
import { type ErrorWithMetadata } from '../errors.js';
export declare function enhanceViteSSRError({
	error,
	filePath,
	loader,
	renderers,
}: {
	error: unknown;
	filePath?: URL;
	loader?: ModuleLoader;
	renderers?: SSRLoadedRenderer[];
}): Error;
export interface AstroErrorPayload {
	__isEnhancedAstroErrorPayload: true;
	type: ErrorPayload['type'];
	err: Omit<ErrorPayload['err'], 'loc'> & {
		name?: string;
		title?: string;
		hint?: string;
		docslink?: string;
		highlightedCode?: string;
		loc?: {
			file?: string;
			line?: number;
			column?: number;
		};
		cause?: unknown;
	};
}
/**
 * Generate a payload for Vite's error overlay
 */
export declare function getViteErrorPayload(err: ErrorWithMetadata): Promise<AstroErrorPayload>;
