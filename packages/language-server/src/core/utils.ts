import {
	FileCapabilities,
	FileKind,
	FileRangeCapabilities,
	type VirtualFile,
} from '@volar/language-core';
import * as path from 'node:path';
import { URI, Utils } from 'vscode-uri';
import { getPackagePath, importSvelteIntegration, importVueIntegration } from '../importPackage';

export interface AstroInstall {
	path: string;
	version: {
		full: string;
		major: number;
		minor: number;
		patch: number;
	};
}

export function getAstroInstall(basePaths: string[]): AstroInstall | undefined {
	let astroPath;
	let version;

	try {
		astroPath = getPackagePath('astro', basePaths);

		if (!astroPath) {
			throw Error;
		}

		version = require(path.resolve(astroPath, 'package.json')).version;
	} catch {
		// If we couldn't find it inside the workspace's node_modules, it might means we're in the monorepo
		try {
			astroPath = getPackagePath('./packages/astro', basePaths);

			if (!astroPath) {
				throw Error;
			}

			version = require(path.resolve(astroPath, 'package.json')).version;
		} catch (e) {
			// If we still couldn't find it, it probably just doesn't exist
			console.error(
				`${basePaths[0]} seems to be an Astro project, but we couldn't find Astro or Astro is not installed`
			);

			return undefined;
		}
	}

	let [major, minor, patch] = version.split('.');

	if (patch.includes('-')) {
		const patchParts = patch.split('-');
		patch = patchParts[0];
	}

	return {
		path: astroPath,
		version: {
			full: version,
			major: Number(major),
			minor: Number(minor),
			patch: Number(patch),
		},
	};
}

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
	const tsx = patchTSX(integrationEditorEntrypoint.toTSX(sourceCode, className));

	return getVirtualFile(tsx);

	function getVirtualFile(content: string): VirtualFile {
		return {
			fileName: fileName + '.tsx',
			capabilities: FileCapabilities.full,
			kind: FileKind.TypeScriptHostFile,
			snapshot: {
				getText: (start, end) => content.substring(start, end),
				getLength: () => content.length,
				getChangeRange: () => undefined,
			},
			codegenStacks: [],
			mappings: [
				{
					sourceRange: [0, content.length],
					generatedRange: [0, 0],
					data: FileRangeCapabilities.full,
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
export function patchTSX(code: string) {
	return code.replace('__AstroComponent_', '');
}
