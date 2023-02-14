import type { TSXResult } from '@astrojs/compiler/types';
import { convertToTSX } from './workers/TSXService';

export function astro2tsx(content: string, fileName: string): TSXResult {
	const tsx = convertToTSX(content, { filename: fileName });

	return tsx;
}
