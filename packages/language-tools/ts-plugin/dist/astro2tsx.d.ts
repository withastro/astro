import type { VirtualCode } from '@volar/language-core';
export declare function astro2tsx(
	input: string,
	fileName: string,
): {
	virtualFile: VirtualCode;
	diagnostics:
		| import('@astrojs/compiler').DiagnosticMessage[]
		| {
				code: 1000;
				location: {
					file: string;
					line: number;
					column: number;
					length: number;
				};
				severity: 1;
				text: string;
		  }[];
};
