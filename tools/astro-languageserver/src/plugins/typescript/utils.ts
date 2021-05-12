import * as ts from 'typescript';
import { CompletionItemKind, DiagnosticSeverity } from 'vscode-languageserver';
import { dirname } from 'path';
import { pathToUrl } from '../../utils';

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

export function isAstroFilePath(filePath: string) {
  return filePath.endsWith('.astro');
}

export function isVirtualAstroFilePath(filePath: string) {
  return filePath.endsWith('.astro.ts');
}

export function toVirtualAstroFilePath(filePath: string) {
  return `${filePath}.ts`;
}

export function toRealAstroFilePath(filePath: string) {
  return filePath.slice(0, -'.ts'.length);
}

export function ensureRealAstroFilePath(filePath: string) {
  return isVirtualAstroFilePath(filePath) ? toRealAstroFilePath(filePath) : filePath;
}

export function findTsConfigPath(fileName: string, rootUris: string[]) {
  const searchDir = dirname(fileName);
  const path = ts.findConfigFile(searchDir, ts.sys.fileExists, 'tsconfig.json') || ts.findConfigFile(searchDir, ts.sys.fileExists, 'jsconfig.json') || '';
  // Don't return config files that exceed the current workspace context.
  return !!path && rootUris.some((rootUri) => isSubPath(rootUri, path)) ? path : '';
}

/**  */
export function isSubPath(uri: string, possibleSubPath: string): boolean {
  return pathToUrl(possibleSubPath).startsWith(uri);
}

/** Substitutes */
export function substituteWithWhitespace(result: string, start: number, end: number, oldContent: string, before: string, after: string) {
  let accumulatedWS = 0;
  result += before;
  for (let i = start + before.length; i < end; i++) {
    let ch = oldContent[i];
    if (ch === '\n' || ch === '\r') {
      // only write new lines, skip the whitespace
      accumulatedWS = 0;
      result += ch;
    } else {
      accumulatedWS++;
    }
  }
  result = append(result, ' ', accumulatedWS - after.length);
  result += after;
  return result;
}

function append(result: string, str: string, n: number): string {
  while (n > 0) {
    if (n & 1) {
      result += str;
    }
    n >>= 1;
    str += str;
  }
  return result;
}
