import { dirname, extname } from 'path';
import type { Node } from 'vscode-html-languageservice';
import {
	CompletionItemKind,
	Position,
	Range,
	SemanticTokenModifiers,
	SemanticTokensLegend,
	SemanticTokenTypes,
	SymbolKind,
} from 'vscode-languageserver';
import { AstroDocument, mapRangeToOriginal, TagInformation } from '../../core/documents';
import { pathToUrl } from '../../utils';
import type { AstroSnapshot, DocumentSnapshot, ScriptTagDocumentSnapshot } from './snapshots/DocumentSnapshot';

export const enum TokenType {
	class,
	enum,
	interface,
	namespace,
	typeParameter,
	type,
	parameter,
	variable,
	enumMember,
	property,
	function,
	method,
}

export const enum TokenModifier {
	declaration,
	static,
	async,
	readonly,
	defaultLibrary,
	local,
}

export function getSemanticTokenLegend(): SemanticTokensLegend {
	const tokenModifiers: string[] = [];

	(
		[
			[TokenModifier.declaration, SemanticTokenModifiers.declaration],
			[TokenModifier.static, SemanticTokenModifiers.static],
			[TokenModifier.async, SemanticTokenModifiers.async],
			[TokenModifier.readonly, SemanticTokenModifiers.readonly],
			[TokenModifier.defaultLibrary, SemanticTokenModifiers.defaultLibrary],
			[TokenModifier.local, 'local'],
		] as const
	).forEach(([tsModifier, legend]) => (tokenModifiers[tsModifier] = legend));

	const tokenTypes: string[] = [];

	(
		[
			[TokenType.class, SemanticTokenTypes.class],
			[TokenType.enum, SemanticTokenTypes.enum],
			[TokenType.interface, SemanticTokenTypes.interface],
			[TokenType.namespace, SemanticTokenTypes.namespace],
			[TokenType.typeParameter, SemanticTokenTypes.typeParameter],
			[TokenType.type, SemanticTokenTypes.type],
			[TokenType.parameter, SemanticTokenTypes.parameter],
			[TokenType.variable, SemanticTokenTypes.variable],
			[TokenType.enumMember, SemanticTokenTypes.enumMember],
			[TokenType.property, SemanticTokenTypes.property],
			[TokenType.function, SemanticTokenTypes.function],
			[TokenType.method, SemanticTokenTypes.method],
		] as const
	).forEach(([tokenType, legend]) => (tokenTypes[tokenType] = legend));

	return {
		tokenModifiers,
		tokenTypes,
	};
}

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

export function scriptElementKindToCompletionItemKind(
	kind: ts.ScriptElementKind,
	ts: typeof import('typescript/lib/tsserverlibrary')
): CompletionItemKind {
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

export function getCommitCharactersForScriptElement(
	kind: ts.ScriptElementKind,
	ts: typeof import('typescript/lib/tsserverlibrary')
): string[] | undefined {
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

export function getExtensionFromScriptKind(
	kind: ts.ScriptKind | undefined,
	ts: typeof import('typescript/lib/tsserverlibrary')
): ts.Extension {
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

export function findTsConfigPath(
	fileName: string,
	rootUris: string[],
	ts: typeof import('typescript/lib/tsserverlibrary')
) {
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

export function getScriptKindFromFileName(
	fileName: string,
	ts: typeof import('typescript/lib/tsserverlibrary')
): ts.ScriptKind {
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

export function convertRange(
	document: { positionAt: (offset: number) => Position },
	range: { start?: number; length?: number }
): Range {
	return Range.create(
		document.positionAt(range.start || 0),
		document.positionAt((range.start || 0) + (range.length || 0))
	);
}

export function convertToLocationRange(defDoc: DocumentSnapshot, textSpan: ts.TextSpan): Range {
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

// Some code actions will insert code at the start of the file instead of inside our frontmatter
// We'll redirect those to the proper starting place
export function ensureFrontmatterInsert(resultRange: Range, document: AstroDocument) {
	if (document.astroMeta.frontmatter.state === 'closed') {
		const position = document.positionAt(document.astroMeta.frontmatter.startOffset!);
		position.line += 1;
		position.character = resultRange.start.character;

		return Range.create(position, position);
	}

	return resultRange;
}

// Some code actions ill insert code at the end of the generated TSX file, so we'll manually
// redirect it to the end of the frontmatter instead
export function checkEndOfFileCodeInsert(resultRange: Range, document: AstroDocument) {
	if (resultRange.start.line > document.lineCount) {
		if (document.astroMeta.frontmatter.state === 'closed') {
			const position = document.positionAt(document.astroMeta.frontmatter.endOffset!);
			return Range.create(position, position);
		}
	}

	return resultRange;
}

export function removeAstroComponentSuffix(name: string) {
	return name.replace(/(\w+)__AstroComponent_/, '$1');
}

export type FrameworkExt = 'astro' | 'vue' | 'jsx' | 'tsx' | 'svelte';
type FrameworkVirtualExt = 'ts' | 'tsx';

const VirtualExtension: Record<FrameworkVirtualExt, FrameworkVirtualExt> = {
	ts: 'ts',
	tsx: 'tsx',
};

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
	// For Document Symbols, we need to return a different snapshot, so we append a query param to the file path
	// However, we need this removed when we need to deal with real (as in, real on the filesystem) paths
	filePath = filePath.replace('?documentSymbols', '');

	if (isVirtualFilePath(filePath)) {
		let extLen = filePath.endsWith('.tsx') ? 4 : 3;
		return filePath.slice(0, filePath.length - extLen);
	} else {
		return filePath;
	}
}

export function isDocumentSymbolsPath(filePath: string) {
	return filePath.endsWith('?documentSymbols');
}

/**
 * Return if a script tag is TypeScript or JavaScript
 */
export function getScriptTagLanguage(scriptTag: TagInformation): 'js' | 'ts' {
	// Using any kind of attributes on the script tag will disable hoisting, so we can just check if there's any
	if (Object.entries(scriptTag.attributes).length === 0) {
		return 'ts';
	}

	return 'js';
}

export function getScriptTagSnapshot(
	snapshot: AstroSnapshot,
	document: AstroDocument,
	tagInfo: Node | { start: number; end: number },
	position?: Position
): {
	snapshot: ScriptTagDocumentSnapshot;
	filePath: string;
	index: number;
	offset: number;
} {
	const index = document.scriptTags.findIndex((value) => value.container.start == tagInfo.start);

	const scriptTagLanguage = getScriptTagLanguage(document.scriptTags[index]);
	const scriptFilePath = snapshot.filePath + `.__script${index}.${scriptTagLanguage}`;
	const scriptTagSnapshot = snapshot.scriptTagSnapshots[index];

	let offset = 0;
	if (position) {
		offset = scriptTagSnapshot.offsetAt(scriptTagSnapshot.getGeneratedPosition(position));
	}

	return {
		snapshot: scriptTagSnapshot,
		filePath: scriptFilePath,
		index,
		offset,
	};
}
