import { TSXResult } from '@astrojs/compiler/shared/types';
import { convertToTSX } from '../../core/worker/TSXService';

export default function (content: string, fileName: string): TSXResult {
	const tsx = convertToTSX(content, { sourcefile: fileName });

	return tsx;
}
