import type { LanguageServicePlugin } from '@volar/language-server';
export declare const create: (
	ts: typeof import('typescript'),
	options?: {
		disableAutoImportCache: boolean | undefined;
	},
) => LanguageServicePlugin[];
