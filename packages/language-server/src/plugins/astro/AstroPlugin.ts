import { DefinitionLink } from 'vscode-languageserver';
import type { Document, DocumentManager } from '../../core/documents';
import type { ConfigManager } from '../../core/config';
import type { CompletionsProvider, AppCompletionList, FoldingRangeProvider } from '../interfaces';
import {
  CompletionContext,
  Position,
  CompletionList,
  CompletionItem,
  CompletionItemKind,
  CompletionTriggerKind,
  InsertTextFormat,
  LocationLink,
  FoldingRange,
  MarkupContent,
  MarkupKind,
  Range,
  TextEdit,
} from 'vscode-languageserver';
import { Node } from 'vscode-html-languageservice';
import { isPossibleClientComponent, pathToUrl, urlToPath } from '../../utils';
import { isAstroFilePath, isVirtualAstroFilePath, toVirtualAstroFilePath } from '../typescript/utils';
import { isInsideFrontmatter } from '../../core/documents/utils';
import * as ts from 'typescript';
import type { FunctionDeclaration } from 'typescript';
import { LanguageServiceManager as TypeScriptLanguageServiceManager } from '../typescript/LanguageServiceManager';
import { ensureRealFilePath } from '../typescript/utils';
import { FoldingRangeKind } from 'vscode-languageserver-types';

export class AstroPlugin implements CompletionsProvider, FoldingRangeProvider {
  private readonly docManager: DocumentManager;
  private readonly configManager: ConfigManager;
  private readonly tsLanguageServiceManager: TypeScriptLanguageServiceManager;
  public pluginName = 'Astro';

  constructor(docManager: DocumentManager, configManager: ConfigManager, workspaceUris: string[]) {
    this.docManager = docManager;
    this.configManager = configManager;
    this.tsLanguageServiceManager = new TypeScriptLanguageServiceManager(docManager, configManager, workspaceUris);
  }

  async getCompletions(document: Document, position: Position, completionContext?: CompletionContext): Promise<AppCompletionList | null> {
    const doc = this.docManager.get(document.uri);
    if (!doc) return null;

    let items: CompletionItem[] = [];

    if (completionContext?.triggerCharacter === '-') {
      const frontmatter = this.getComponentScriptCompletion(doc, position, completionContext);
      if (frontmatter) items.push(frontmatter);
    }

    if (completionContext?.triggerCharacter === ':') {
      const clientHint = this.getClientHintCompletion(doc, position, completionContext);
      if (clientHint) items.push(...clientHint);
    }

    if (!this.isInsideFrontmatter(document, position)) {
      const props = await this.getPropCompletions(document, position, completionContext);
      if (props.length) {
        items.push(...props);
      }
    }

    return CompletionList.create(items, true);
  }

  async getFoldingRanges(document: Document): Promise<FoldingRange[]> {
    const foldingRanges: FoldingRange[] = [];
    const { frontmatter } = document.astro;

    // Currently editing frontmatter, don't fold
    if (frontmatter.state !== 'closed') return foldingRanges;

    const start = document.positionAt(frontmatter.startOffset as number);
    const end = document.positionAt((frontmatter.endOffset as number) - 3);
    return [
      {
        startLine: start.line,
        startCharacter: start.character,
        endLine: end.line,
        endCharacter: end.character,
        kind: FoldingRangeKind.Imports,
      },
    ];
  }

  async getDefinitions(document: Document, position: Position): Promise<DefinitionLink[]> {
    if (this.isInsideFrontmatter(document, position)) {
      return [];
    }

    const offset = document.offsetAt(position);
    const html = document.html;

    const node = html.findNodeAt(offset);
    if (!this.isComponentTag(node)) {
      return [];
    }

    const [componentName] = node.tag!.split(':');

    const { lang } = await this.tsLanguageServiceManager.getTypeScriptDoc(document);
    const defs = this.getDefinitionsForComponentName(document, lang, componentName);

    if (!defs || !defs.length) {
      return [];
    }

    const startRange: Range = Range.create(Position.create(0, 0), Position.create(0, 0));
    const links = defs.map((def) => {
      const defFilePath = ensureRealFilePath(def.fileName);
      return LocationLink.create(pathToUrl(defFilePath), startRange, startRange);
    });

    return links;
  }

  private getClientHintCompletion(document: Document, position: Position, completionContext?: CompletionContext): CompletionItem[] | null {
    const node = document.html.findNodeAt(document.offsetAt(position));
    if (!isPossibleClientComponent(node)) return null;

    return [
      {
        label: ':load',
        insertText: 'load',
        commitCharacters: ['l'],
      },
      {
        label: ':idle',
        insertText: 'idle',
        commitCharacters: ['i'],
      },
      {
        label: ':visible',
        insertText: 'visible',
        commitCharacters: ['v'],
      },
    ];
  }

  private getComponentScriptCompletion(document: Document, position: Position, completionContext?: CompletionContext): CompletionItem | null {
    const base = {
      kind: CompletionItemKind.Snippet,
      label: '---',
      sortText: '\0',
      preselect: true,
      detail: 'Component script',
      insertTextFormat: InsertTextFormat.Snippet,
      commitCharacters: ['-'],
    };
    const prefix = document.getLineUntilOffset(document.offsetAt(position));

    if (document.astro.frontmatter.state === null) {
      return {
        ...base,
        insertText: '---\n$0\n---',
        textEdit: prefix.match(/^\s*\-+/) ? TextEdit.replace({ start: { ...position, character: 0 }, end: position }, '---\n$0\n---') : undefined,
      };
    }
    if (document.astro.frontmatter.state === 'open') {
      return {
        ...base,
        insertText: '---',
        textEdit: prefix.match(/^\s*\-+/) ? TextEdit.replace({ start: { ...position, character: 0 }, end: position }, '---') : undefined,
      };
    }
    return null;
  }

  private async getPropCompletions(document: Document, position: Position, completionContext?: CompletionContext): Promise<CompletionItem[]> {
    const offset = document.offsetAt(position);
    const html = document.html;

    const node = html.findNodeAt(offset);
    if (!this.isComponentTag(node)) {
      return [];
    }
    const inAttribute = node.start + node.tag!.length < offset;
    if (!inAttribute) {
      return [];
    }

    if(completionContext?.triggerCharacter === '/' || completionContext?.triggerCharacter === '>') {
      return [];
    }

    // If inside of attributes, skip.
    if (completionContext && completionContext.triggerKind === CompletionTriggerKind.TriggerCharacter && completionContext.triggerCharacter === '"') {
      return [];
    }

    const componentName = node.tag!;
    const { lang: thisLang } = await this.tsLanguageServiceManager.getTypeScriptDoc(document);

    // Get the source file
    const filePath = urlToPath(document.uri);
    const tsFilePath = toVirtualAstroFilePath(filePath!);

    const program = thisLang.getProgram();
    const sourceFile = program?.getSourceFile(tsFilePath);
    const typeChecker = program?.getTypeChecker();
    if (!sourceFile || !typeChecker) {
      return [];
    }

    // Get the import statement
    const imp = this.getImportedSymbol(sourceFile, componentName);
    const importType = imp && typeChecker.getTypeAtLocation(imp);
    if(!importType) {
      return [];
    }

    // Get the import's type
    const componentType = this.getPropType(importType, typeChecker);
    if(!componentType) {
      return [];
    }

    const completionItems: CompletionItem[] = [];

    // Add completions for this types props
    for(let baseType of componentType.getBaseTypes() || []) {
      const members = baseType.getSymbol()?.members || [];
      members.forEach(mem => {
        let completionItem = this.getCompletionItemForTypeMember(mem, typeChecker);
        completionItems.push(completionItem);
      });
    }

    // Add completions for this types base members
    const members = componentType.getSymbol()?.members || [];
    members.forEach(mem => {
      let completionItem = this.getCompletionItemForTypeMember(mem, typeChecker);
      completionItems.push(completionItem);
    });

    return completionItems;
  }

  private getPropType(type: ts.Type, typeChecker: ts.TypeChecker): ts.Type | null {
    const sym = type?.getSymbol();
    if(!sym) {
      return null;
    }

    for(const decl of sym?.getDeclarations() || []) {
      const fileName = decl.getSourceFile().fileName;
      if(isVirtualAstroFilePath(fileName)) {
        if(!ts.isFunctionDeclaration(decl)) {
          console.error(`Unexpected: .astro files should export a default function for the component definition.`);
          continue;
        }
        const fn = decl as FunctionDeclaration;
        if(!fn.parameters.length) continue;
        const param1 = fn.parameters[0];
        const type = typeChecker.getTypeAtLocation(param1);
        return type;
      } else if(fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) {
        if(!ts.isFunctionDeclaration(decl)) {
          console.error(`We only support function components for tsx/jsx at the moment.`);
          continue;
        }
        const fn = decl as FunctionDeclaration;
        if(!fn.parameters.length) continue;
        const param1 = fn.parameters[0];
        const type = typeChecker.getTypeAtLocation(param1);
        return type;
      }
    }

    return null;
  }

  private getCompletionItemForTypeMember(mem: ts.Symbol, typeChecker: ts.TypeChecker) {
    let item: CompletionItem = {
      label: mem.name,
      insertText: mem.name,
      commitCharacters: [],
    };

    mem.getDocumentationComment(typeChecker);
    let description = mem
      .getDocumentationComment(typeChecker)
      .map((val) => val.text)
      .join('\n');

    if (description) {
      let docs: MarkupContent = {
        kind: MarkupKind.Markdown,
        value: description,
      };
      item.documentation = docs;
    }
    return item;
  }

  private isInsideFrontmatter(document: Document, position: Position) {
    return isInsideFrontmatter(document.getText(), document.offsetAt(position));
  }

  private isComponentTag(node: Node): boolean {
    if (!node.tag) {
      return false;
    }
    const firstChar = node.tag[0];
    return /[A-Z]/.test(firstChar);
  }

  private getDefinitionsForComponentName(document: Document, lang: ts.LanguageService, componentName: string): readonly ts.DefinitionInfo[] | undefined {
    const filePath = urlToPath(document.uri);
    const tsFilePath = toVirtualAstroFilePath(filePath!);

    const program = lang.getProgram();
    const sourceFile = program?.getSourceFile(tsFilePath);
    if (!sourceFile) {
      return undefined;
    }

    const specifier = this.getImportSpecifierForIdentifier(sourceFile, componentName);
    if (!specifier) {
      return [];
    }

    const defs = lang.getDefinitionAtPosition(tsFilePath, specifier.getStart());
    if (!defs) {
      return undefined;
    }

    return defs;
  }

  private getImportedSymbol(sourceFile: ts.SourceFile, identifier: string): ts.ImportSpecifier | ts.Identifier | null {
    for(let list of sourceFile.getChildren()) {
      for(let node of list.getChildren()) {
        if (ts.isImportDeclaration(node)) {
          let clauses = node.importClause;
          if(!clauses) return null;
          let namedImport = clauses.getChildAt(0);

          if(ts.isNamedImports(namedImport)) {
            for (let imp of namedImport.elements) { // Iterate the named imports
              if(imp.name.getText() === identifier) {
                return imp;
              }
            }
          } else if(ts.isIdentifier(namedImport)) {
            if(namedImport.getText() === identifier) {
              return namedImport;
            }
          }
        }
      }
    }

    return null;
  }

  private getImportSpecifierForIdentifier(sourceFile: ts.SourceFile, identifier: string): ts.Expression | undefined {
    let importSpecifier: ts.Expression | undefined = undefined;
    ts.forEachChild(sourceFile, (tsNode) => {
      if (ts.isImportDeclaration(tsNode)) {
        if (tsNode.importClause) {
          const { name, namedBindings } = tsNode.importClause;
          if (name && name.getText() === identifier) {
            importSpecifier = tsNode.moduleSpecifier;
            return true;
          } else if(namedBindings && namedBindings.kind === ts.SyntaxKind.NamedImports) {
            const elements = (namedBindings as ts.NamedImports).elements;
            for(let elem of elements) {
              if(elem.name.getText() === identifier) {
                importSpecifier = tsNode.moduleSpecifier;
                return true;
              }
            }
          }
        }
      }
    });
    return importSpecifier;
  }
}

function isNodeExported(node: ts.Node): boolean {
  return (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 || (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
}
