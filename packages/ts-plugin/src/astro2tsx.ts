import { convertToTSX } from '@astrojs/compiler/sync';
import type { TSXResult } from '@astrojs/compiler/types';

export function astro2tsx(content: string, fileName: string): TSXResult {
	const tsx = convertToTSX(content, { filename: fileName });

	return tsx;
}
