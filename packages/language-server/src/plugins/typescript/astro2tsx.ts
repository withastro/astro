import type { TSXResult } from '@astrojs/compiler/types';
import { convertToTSX } from '../../core/worker/TSXService';

export default function (content: string, fileName: string): TSXResult {
	const tsx = convertToTSX(content, { filename: fileName });

	return tsx;
}
