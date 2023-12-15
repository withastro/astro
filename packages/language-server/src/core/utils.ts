import type { VirtualFile } from '@volar/language-core';
import * as path from 'node:path';
import { URI, Utils } from 'vscode-uri';
import { importSvelteIntegration, importVueIntegration } from '../importPackage';

export function framework2tsx(
	fileName: string,
	filePath: string,
	sourceCode: string,
	framework: 'vue' | 'svelte'
): VirtualFile {
	const integrationEditorEntrypoint =
		framework === 'vue' ? importVueIntegration(filePath) : importSvelteIntegration(filePath);

	if (!integrationEditorEntrypoint) {
		const EMPTY_FILE = '';
		return getVirtualFile(EMPTY_FILE);
	}

	const className = classNameFromFilename(filePath);
	const tsx = patchTSX(integrationEditorEntrypoint.toTSX(sourceCode, className), fileName);

	return getVirtualFile(tsx);

	function getVirtualFile(content: string): VirtualFile {
		return {
			fileName: fileName + '.tsx',
			languageId: 'typescript',
			typescript: {
				scriptKind: 4 satisfies import('typescript/lib/tsserverlibrary').ScriptKind.TSX,
			},
			snapshot: {
				getText: (start, end) => content.substring(start, end),
				getLength: () => content.length,
				getChangeRange: () => undefined,
			},
			mappings: [
				{
					sourceOffsets: [0],
					generatedOffsets: [0],
					lengths: [content.length],
					data: {
						verification: true,
						completion: true,
						semantic: true,
						navigation: true,
						structure: true,
						format: true,
					},
				},
			],
			embeddedFiles: [],
		};
	}
}

/**
 * Transform a string into PascalCase
 */
function toPascalCase(string: string) {
	return `${string}`
		.replace(new RegExp(/[-_]+/, 'g'), ' ')
		.replace(new RegExp(/[^\w\s]/, 'g'), '')
		.replace(
			new RegExp(/\s+(.)(\w*)/, 'g'),
			($1, $2, $3) => `${$2.toUpperCase() + $3.toLowerCase()}`
		)
		.replace(new RegExp(/\w/), (s) => s.toUpperCase());
}

export function classNameFromFilename(filename: string): string {
	const url = URI.parse(filename);
	const withoutExtensions = Utils.basename(url).slice(0, -Utils.extname(url).length);

	const withoutInvalidCharacters = withoutExtensions
		.split('')
		// Although "-" is invalid, we leave it in, pascal-case-handling will throw it out later
		.filter((char) => /[A-Za-z$_\d-]/.test(char))
		.join('');
	const firstValidCharIdx = withoutInvalidCharacters
		.split('')
		// Although _ and $ are valid first characters for classes, they are invalid first characters
		// for tag names. For a better import autocompletion experience, we therefore throw them out.
		.findIndex((char) => /[A-Za-z]/.test(char));

	const withoutLeadingInvalidCharacters = withoutInvalidCharacters.substring(firstValidCharIdx);
	const inPascalCase = toPascalCase(withoutLeadingInvalidCharacters);
	const finalName = firstValidCharIdx === -1 ? `A${inPascalCase}` : inPascalCase;

	return finalName;
}

// TODO: Patch the upstream packages with these changes
export function patchTSX(code: string, fileName: string) {
	const basename = path.basename(fileName, path.extname(fileName));
	const isDynamic = basename.startsWith('[') && basename.endsWith(']');

	return code.replace(/\b(\S*)__AstroComponent_/gm, (fullMatch, m1: string) => {
		// If we don't have a match here, it usually means the file has a weird name that couldn't be expressed with valid identifier characters
		if (!m1) {
			if (basename === '404') return 'FourOhFour';
			return fullMatch;
		}
		return isDynamic ? `_${m1}_` : m1[0].toUpperCase() + m1.slice(1);
	});
}
