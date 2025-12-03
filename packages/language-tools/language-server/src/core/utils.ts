import type { VirtualCode } from '@volar/language-core';
import { URI, Utils } from 'vscode-uri';
import { importSvelteIntegration, importVueIntegration } from '../importPackage';

export function framework2tsx(
	filePath: string,
	sourceCode: string,
	framework: 'vue' | 'svelte',
): VirtualCode {
	const integrationEditorEntrypoint =
		framework === 'vue' ? importVueIntegration(filePath) : importSvelteIntegration(filePath);

	if (!integrationEditorEntrypoint) {
		const EMPTY_FILE = '';
		return getVirtualCode(EMPTY_FILE);
	}

	const className = classNameFromFilename(filePath);
	const tsx = patchTSX(integrationEditorEntrypoint.toTSX(sourceCode, className), filePath);

	return getVirtualCode(tsx);

	function getVirtualCode(content: string): VirtualCode {
		return {
			id: 'tsx',
			languageId: 'typescript',
			snapshot: {
				getText: (start, end) => content.substring(start, end),
				getLength: () => content.length,
				getChangeRange: () => undefined,
			},
			mappings: [],
			embeddedCodes: [],
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
			(_, $2, $3) => `${$2.toUpperCase() + $3.toLowerCase()}`,
		)
		.replace(new RegExp(/\w/), (s) => s.toUpperCase());
}

export function classNameFromFilename(filename: string): string {
	const url = URI.parse(filename);
	const withoutExtensions = Utils.basename(url).slice(0, -Utils.extname(url).length);

	const withoutInvalidCharacters = withoutExtensions
		.split('')
		// Although "-" is invalid, we leave it in, pascal-case-handling will throw it out later
		.filter((char) => /[\w$-]/.test(char))
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
export function patchTSX(code: string, filePath: string) {
	const basename = filePath.split('/').pop()!;
	const isDynamic = basename.startsWith('[') && basename.endsWith(']');

	return code.replace(/\b(\S*)__AstroComponent_/g, (fullMatch, m1: string) => {
		// If we don't have a match here, it usually means the file has a weird name that couldn't be expressed with valid identifier characters
		if (!m1) {
			if (basename === '404') return 'FourOhFour';
			return fullMatch;
		}
		return isDynamic ? `_${m1}_` : m1[0].toUpperCase() + m1.slice(1);
	});
}
