import type { ModuleLoader } from '../core/module-loader/index.js';
import type { SSRResult } from '../types/public/internal.js';
export declare function getComponentMetadata(
	filePath: URL,
	loader: ModuleLoader,
): Promise<SSRResult['componentMetadata']>;
