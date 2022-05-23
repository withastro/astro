import { dirname } from 'path';
import ts from 'typescript';
import {
    CompletionItemKind,
    DiagnosticSeverity,
    DiagnosticTag,
    Position,
    Range,
    SymbolKind
} from 'vscode-languageserver';
import { Document, isInTag, mapRangeToOriginal } from '../../lib/documents';
import { pathToUrl } from '../../utils';
import { SnapshotFragment, SvelteSnapshotFragment } from './DocumentSnapshot';

export function getScriptKindFromFileName(fileName: string): ts.ScriptKind {
    const ext = fileName.substr(fileName.lastIndexOf('.'));
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

export function getScriptKindFromAttributes(
    attrs: Record<string, string>
): ts.ScriptKind.TSX | ts.ScriptKind.JSX {
    const type = attrs.lang || attrs.type;

    switch (type) {
        case 'ts':
        case 'typescript':
        case 'text/ts':
        case 'text/typescript':
            return ts.ScriptKind.TSX;
        case 'javascript':
        case 'text/javascript':
        default:
            return ts.ScriptKind.JSX;
    }
}

export function isSvelteFilePath(filePath: string) {
    return filePath.endsWith('.svelte');
}

export function isVirtualSvelteFilePath(filePath: string) {
    return filePath.endsWith('.svelte.ts');
}

export function toRealSvelteFilePath(filePath: string) {
    return filePath.slice(0, -'.ts'.length);
}

export function ensureRealSvelteFilePath(filePath: string) {
    return isVirtualSvelteFilePath(filePath) ? toRealSvelteFilePath(filePath) : filePath;
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

export function hasNonZeroRange({ range }: { range?: Range }): boolean {
    return (
        !!range &&
        (range.start.line !== range.end.line || range.start.character !== range.end.character)
    );
}

export function rangeToTextSpan(
    range: Range,
    document: { offsetAt: (position: Position) => number }
): ts.TextSpan {
    const start = document.offsetAt(range.start);
    const end = document.offsetAt(range.end);
    return { start, length: end - start };
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
    kind: ts.ScriptElementKind
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
    kind: ts.ScriptElementKind
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

    return DiagnosticSeverity.Error;
}

// Matches comments that come before any non-comment content
const commentsRegex = /^(\s*\/\/.*\s*)*/;
// The following regex matches @ts-check or @ts-nocheck if:
// - must be @ts-(no)check
// - the comment which has @ts-(no)check can have any type of whitespace before it, but not other characters
// - what's coming after @ts-(no)check is irrelevant as long there is any kind of whitespace or line break, so this would be picked up, too: // @ts-check asdasd
// [ \t\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]
// is just \s (a.k.a any whitespace character) without linebreak and vertical tab
// eslint-disable-next-line max-len
const tsCheckRegex =
    /\/\/[ \t\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]*(@ts-(no)?check)($|\s)/;

/**
 * Returns `// @ts-check` or `// @ts-nocheck` if content starts with comments and has one of these
 * in its comments.
 */
export function getTsCheckComment(str = ''): string | undefined {
    const comments = str.match(commentsRegex)?.[0];
    if (comments) {
        const tsCheck = comments.match(tsCheckRegex);
        if (tsCheck) {
            // second-last entry is the capturing group with the exact ts-check wording
            return `// ${tsCheck[tsCheck.length - 3]}${ts.sys.newLine}`;
        }
    }
}

export function convertToTextSpan(range: Range, fragment: SnapshotFragment): ts.TextSpan {
    const start = fragment.offsetAt(fragment.getGeneratedPosition(range.start));
    const end = fragment.offsetAt(fragment.getGeneratedPosition(range.end));

    return {
        start,
        length: end - start
    };
}

export function isInScript(position: Position, fragment: SvelteSnapshotFragment | Document) {
    return isInTag(position, fragment.scriptInfo) || isInTag(position, fragment.moduleScriptInfo);
}

export function getDiagnosticTag(diagnostic: ts.Diagnostic): DiagnosticTag[] {
    const tags: DiagnosticTag[] = [];
    if (diagnostic.reportsUnnecessary) {
        tags.push(DiagnosticTag.Unnecessary);
    }
    if (diagnostic.reportsDeprecated) {
        tags.push(DiagnosticTag.Deprecated);
    }
    return tags;
}

export function changeSvelteComponentName(name: string) {
    return name.replace(/(\w+)__SvelteComponent_/, '$1');
}

export function hasTsExtensions(fileName: string) {
    return (
        fileName.endsWith(ts.Extension.Dts) ||
        fileName.endsWith(ts.Extension.Tsx) ||
        fileName.endsWith(ts.Extension.Ts)
    );
}
