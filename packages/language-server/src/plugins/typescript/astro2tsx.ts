import { convertToTSX } from '@astrojs/compiler/sync';
import type { TSXResult } from '@astrojs/compiler/types';

export function astro2tsx(content: string, fileName: string): TSXResult {
	try {
		const tsx = convertToTSX(content, { filename: fileName });
		return tsx;
	} catch (e) {
		console.error(
			`There was an error transforming ${fileName} to TSX. An empty file will be returned instead. Please create an issue: https://github.com/withastro/language-tools/issues\nError: ${e}.`
		);
		return {
			code: '',
			map: {
				file: fileName,
				sources: [],
				sourcesContent: [],
				names: [],
				mappings: '',
				version: 0,
			},
			diagnostics: [],
		};
	}
}
