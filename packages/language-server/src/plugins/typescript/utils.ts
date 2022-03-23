import ts from 'typescript';
import { dirname, extname } from 'path';
import { pathToUrl } from '../../utils';
import { CompletionItemKind, DiagnosticSeverity, Position, Range, SymbolKind } from 'vscode-languageserver';
import { mapRangeToOriginal } from '../../core/documents';
import { SnapshotFragment } from './snapshots/DocumentSnapshot';

export function symbolKindFromString(kind: string): SymbolKind {
	switch (kind) {
		case 'module':
			return SymbolKind.Module;
		case 'class':
			return SymbolKind.Class;
		case 'local class':
			return SymbolKind.Class;
		case 'interface':
			return SymbolKind.Interface;
		case 'enum':
			return SymbolKind.Enum;
		case 'enum member':
			return SymbolKind.Constant;
		case 'var':
			return SymbolKind.Variable;
		case 'local var':
			return SymbolKind.Variable;
		case 'function':
			return SymbolKind.Function;
		case 'local function':
			return SymbolKind.Function;
		case 'method':
			return SymbolKind.Method;
		case 'getter':
			return SymbolKind.Method;
		case 'setter':
			return SymbolKind.Method;
		case 'property':
			return SymbolKind.Property;
		case 'constructor':
			return SymbolKind.Constructor;
		case 'parameter':
			return SymbolKind.Variable;
		case 'type parameter':
			return SymbolKind.Variable;
		case 'alias':
			return SymbolKind.Variable;
		case 'let':
			return SymbolKind.Variable;
		case 'const':
			return SymbolKind.Constant;
		case 'JSX attribute':
			return SymbolKind.Property;
		default:
			return SymbolKind.Variable;
	}
}

export function scriptElementKindToCompletionItemKind(kind: ts.ScriptElementKind): CompletionItemKind {
	switch (kind) {
		case ts.ScriptElementKind.primitiveType:
		case ts.ScriptElementKind.keyword:
			return CompletionItemKind.Keyword;
		case ts.ScriptElementKind.constElement:
			return CompletionItemKind.Constant;
		case ts.ScriptElementKind.letElement:
		case ts.ScriptElementKind.variableElement:
		case ts.ScriptElementKind.localVariableElement:
		case ts.ScriptElementKind.alias:
			return CompletionItemKind.Variable;
		case ts.ScriptElementKind.memberVariableElement:
		case ts.ScriptElementKind.memberGetAccessorElement:
		case ts.ScriptElementKind.memberSetAccessorElement:
			return CompletionItemKind.Field;
		case ts.ScriptElementKind.functionElement:
			return CompletionItemKind.Function;
		case ts.ScriptElementKind.memberFunctionElement:
		case ts.ScriptElementKind.constructSignatureElement:
		case ts.ScriptElementKind.callSignatureElement:
		case ts.ScriptElementKind.indexSignatureElement:
			return CompletionItemKind.Method;
		case ts.ScriptElementKind.enumElement:
			return CompletionItemKind.Enum;
		case ts.ScriptElementKind.moduleElement:
		case ts.ScriptElementKind.externalModuleName:
			return CompletionItemKind.Module;
		case ts.ScriptElementKind.classElement:
		case ts.ScriptElementKind.typeElement:
			return CompletionItemKind.Class;
		case ts.ScriptElementKind.interfaceElement:
			return CompletionItemKind.Interface;
		case ts.ScriptElementKind.warning:
		case ts.ScriptElementKind.scriptElement:
			return CompletionItemKind.File;
		case ts.ScriptElementKind.directory:
			return CompletionItemKind.Folder;
		case ts.ScriptElementKind.string:
			return CompletionItemKind.Constant;
	}
	return CompletionItemKind.Property;
}

export function getCommitCharactersForScriptElement(kind: ts.ScriptElementKind): string[] | undefined {
	const commitCharacters: string[] = [];
	switch (kind) {
		case ts.ScriptElementKind.memberGetAccessorElement:
		case ts.ScriptElementKind.memberSetAccessorElement:
		case ts.ScriptElementKind.constructSignatureElement:
		case ts.ScriptElementKind.callSignatureElement:
		case ts.ScriptElementKind.indexSignatureElement:
		case ts.ScriptElementKind.enumElement:
		case ts.ScriptElementKind.interfaceElement:
			commitCharacters.push('.');
			break;

		case ts.ScriptElementKind.moduleElement:
		case ts.ScriptElementKind.alias:
		case ts.ScriptElementKind.constElement:
		case ts.ScriptElementKind.letElement:
		case ts.ScriptElementKind.variableElement:
		case ts.ScriptElementKind.localVariableElement:
		case ts.ScriptElementKind.memberVariableElement:
		case ts.ScriptElementKind.classElement:
		case ts.ScriptElementKind.functionElement:
		case ts.ScriptElementKind.memberFunctionElement:
			commitCharacters.push('.', ',');
			commitCharacters.push('(');
			break;
	}

	return commitCharacters.length === 0 ? undefined : commitCharacters;
}

export function getExtensionFromScriptKind(kind: ts.ScriptKind | undefined): ts.Extension {
	switch (kind) {
		case ts.ScriptKind.JSX:
			return ts.Extension.Jsx;
		case ts.ScriptKind.TS:
			return ts.Extension.Ts;
		case ts.ScriptKind.TSX:
			return ts.Extension.Tsx;
		case ts.ScriptKind.JSON:
			return ts.Extension.Json;
		case ts.ScriptKind.JS:
		default:
			return ts.Extension.Js;
	}
}

export function findTsConfigPath(fileName: string, rootUris: string[]) {
	const searchDir = dirname(fileName);
	const path =
		ts.findConfigFile(searchDir, ts.sys.fileExists, 'tsconfig.json') ||
		ts.findConfigFile(searchDir, ts.sys.fileExists, 'jsconfig.json') ||
		'';

	// Don't return config files that exceed the current workspace context.
	return !!path && rootUris.some((rootUri) => isSubPath(rootUri, path)) ? path : '';
}

export function isSubPath(uri: string, possibleSubPath: string): boolean {
	return pathToUrl(possibleSubPath).startsWith(uri);
}

export function getScriptKindFromFileName(fileName: string): ts.ScriptKind {
	const ext = fileName.substring(fileName.lastIndexOf('.'));
	switch (ext.toLowerCase()) {
		case ts.Extension.Js:
			return ts.ScriptKind.JS;
		case ts.Extension.Jsx:
			return ts.ScriptKind.JSX;
		case ts.Extension.Ts:
			return ts.ScriptKind.TS;
		case ts.Extension.Tsx:
			return ts.ScriptKind.TSX;
		case ts.Extension.Json:
			return ts.ScriptKind.JSON;
		default:
			return ts.ScriptKind.Unknown;
	}
}

export function mapSeverity(category: ts.DiagnosticCategory): DiagnosticSeverity {
	switch (category) {
		case ts.DiagnosticCategory.Error:
			return DiagnosticSeverity.Error;
		case ts.DiagnosticCategory.Warning:
			return DiagnosticSeverity.Warning;
		case ts.DiagnosticCategory.Suggestion:
			return DiagnosticSeverity.Hint;
		case ts.DiagnosticCategory.Message:
			return DiagnosticSeverity.Information;
	}
}

export function convertRange(
	document: { positionAt: (offset: number) => Position },
	range: { start?: number; length?: number }
): Range {
	return Range.create(
		document.positionAt(range.start || 0),
		document.positionAt((range.start || 0) + (range.length || 0))
	);
}

export function convertToLocationRange(defDoc: SnapshotFragment, textSpan: ts.TextSpan): Range {
	const range = mapRangeToOriginal(defDoc, convertRange(defDoc, textSpan));
	// Some definition like the svelte component class definition don't exist in the original, so we map to 0,1
	if (range.start.line < 0) {
		range.start.line = 0;
		range.start.character = 1;
	}
	if (range.end.line < 0) {
		range.end = range.start;
	}

	return range;
}

export type FrameworkExt = 'astro' | 'vue' | 'jsx' | 'tsx' | 'svelte';
type FrameworkVirtualExt = 'ts' | 'tsx';

const VirtualExtension: Record<FrameworkVirtualExt, FrameworkVirtualExt> = {
	ts: 'ts',
	tsx: 'tsx',
};

type VirtualFrameworkSettings = Record<
	FrameworkExt,
	{
		ext: FrameworkExt;
		virtualExt: FrameworkVirtualExt;
	}
>;

export function getFrameworkFromFilePath(filePath: string): FrameworkExt {
	filePath = ensureRealFilePath(filePath);
	return extname(filePath).substring(1) as FrameworkExt;
}

export function isVirtualFrameworkFilePath(ext: FrameworkExt, virtualExt: FrameworkVirtualExt, filePath: string) {
	return filePath.endsWith('.' + ext + '.' + virtualExt);
}

export function isAstroFilePath(filePath: string) {
	return filePath.endsWith('.astro');
}

export function isFrameworkFilePath(filePath: string) {
	return filePath.endsWith('.svelte') || filePath.endsWith('.vue');
}

export function isVirtualAstroFilePath(filePath: string) {
	return isVirtualFrameworkFilePath('astro', VirtualExtension.tsx, filePath);
}

export function isVirtualVueFilePath(filePath: string) {
	return isVirtualFrameworkFilePath('vue', VirtualExtension.tsx, filePath);
}

export function isVirtualSvelteFilePath(filePath: string) {
	return isVirtualFrameworkFilePath('svelte', VirtualExtension.tsx, filePath);
}

export function isVirtualFilePath(filePath: string) {
	return isVirtualAstroFilePath(filePath) || isVirtualVueFilePath(filePath) || isVirtualSvelteFilePath(filePath);
}

export function toVirtualAstroFilePath(filePath: string) {
	if (isVirtualAstroFilePath(filePath)) {
		return filePath;
	} else if (isAstroFilePath(filePath)) {
		return `${filePath}.tsx`;
	} else {
		return filePath;
	}
}

export function toVirtualFilePath(filePath: string) {
	if (isVirtualFilePath(filePath)) {
		return filePath;
	} else if (isFrameworkFilePath(filePath) || isAstroFilePath(filePath)) {
		return `${filePath}.tsx`;
	} else {
		return filePath;
	}
}

export function toRealAstroFilePath(filePath: string) {
	return filePath.slice(0, -'.tsx'.length);
}

export function ensureRealAstroFilePath(filePath: string) {
	return isVirtualAstroFilePath(filePath) ? toRealAstroFilePath(filePath) : filePath;
}

export function ensureRealFilePath(filePath: string) {
	if (isVirtualFilePath(filePath)) {
		let extLen = filePath.endsWith('.tsx') ? 4 : 3;
		return filePath.slice(0, filePath.length - extLen);
	} else {
		return filePath;
	}
}
