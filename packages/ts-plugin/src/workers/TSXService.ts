import type { TSXResult } from '@astrojs/compiler/shared/types';
import { createSyncFn } from 'synckit';

const convertToTSXSync = createSyncFn(require.resolve('./TSXWorker'));

/**
 * Parse code by `@astrojs/compiler`
 */
export function convertToTSX(source: string, options: { sourcefile: string }): TSXResult {
	return convertToTSXSync(source, options);
}
