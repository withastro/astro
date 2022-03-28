import ts from 'typescript';
import { AstroDocument } from '../../../core/documents';
import astro2tsx from '../astro2tsx';
import {
	FrameworkExt,
	getFrameworkFromFilePath,
	isAstroFilePath,
	isFrameworkFilePath,
} from '../utils';
import { AstroSnapshot, TypeScriptDocumentSnapshot } from './DocumentSnapshot';
import { toTSX as svelte2tsx } from '@astrojs/svelte-language-integration';

// Utilities to create Snapshots from different contexts
export function createFromDocument(document: AstroDocument) {
	const { code } = astro2tsx(document.getText());

	return new AstroSnapshot(document, code, ts.ScriptKind.TSX);
}

/**
 * Returns an Astro or Framework or a ts/js snapshot from a file path, depending on the file contents.
 * @param filePath path to the file
 * @param createDocument function that is used to create a document in case it's an Astro file
 */
export function createFromFilePath(
	filePath: string,
	createDocument: (filePath: string, text: string) => AstroDocument
) {
	if (isAstroFilePath(filePath)) {
		return createFromAstroFilePath(filePath, createDocument);
	} else if (isFrameworkFilePath(filePath)) {
		const framework = getFrameworkFromFilePath(filePath);
		return createFromFrameworkFilePath(filePath, framework);
	} else {
		return createFromTSFilePath(filePath);
	}
}

/**
 * Return a Framework or a TS snapshot from a file path, depending on the file contents
 * Unlike createFromFilePath, this does not support creating an Astro snapshot
 */
export function createFromNonAstroFilePath(filePath: string) {
	if (isFrameworkFilePath(filePath)) {
		const framework = getFrameworkFromFilePath(filePath);
		return createFromFrameworkFilePath(filePath, framework);
	} else {
		return createFromTSFilePath(filePath);
	}
}

/**
 * Returns a ts/js snapshot from a file path.
 * @param filePath path to the js/ts file
 * @param options options that apply in case it's a svelte file
 */
export function createFromTSFilePath(filePath: string) {
	const originalText = ts.sys.readFile(filePath) ?? '';
	return new TypeScriptDocumentSnapshot(0, filePath, originalText);
}

/**
 * Returns an Astro snapshot from a file path.
 * @param filePath path to the Astro file
 * @param createDocument function that is used to create a document
 */
export function createFromAstroFilePath(
	filePath: string,
	createDocument: (filePath: string, text: string) => AstroDocument
) {
	const originalText = ts.sys.readFile(filePath) ?? '';
	return createFromDocument(createDocument(filePath, originalText));
}

export function createFromFrameworkFilePath(filePath: string, framework: FrameworkExt) {
	const originalText = ts.sys.readFile(filePath) ?? '';
	let code = '';

	if (framework === 'svelte') {
		code = svelte2tsx(originalText);
	} else {
		code = 'export default function(props: Record<string, any>): any {<div></div>}';
	}

	return new TypeScriptDocumentSnapshot(0, filePath, code, ts.ScriptKind.TSX);
}
