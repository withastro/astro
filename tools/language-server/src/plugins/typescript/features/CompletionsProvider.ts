import type { CompletionContext, CompletionItem, Position, TextDocumentIdentifier, MarkupContent } from 'vscode-languageserver';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import { isInsideFrontmatter } from '../../../core/documents/utils';
import { Document } from '../../../core/documents';
import * as ts from 'typescript';
import { CompletionList, MarkupKind } from 'vscode-languageserver';
import { AppCompletionItem, AppCompletionList, CompletionsProvider } from '../../interfaces';
import { scriptElementKindToCompletionItemKind, getCommitCharactersForScriptElement, toVirtualAstroFilePath } from '../utils';

const completionOptions: ts.GetCompletionsAtPositionOptions = Object.freeze({
  importModuleSpecifierPreference: 'relative',
  importModuleSpecifierEnding: 'js',
  quotePreference: 'single',
});

export interface CompletionEntryWithIdentifer extends ts.CompletionEntry, TextDocumentIdentifier {
  position: Position;
}

export class CompletionsProviderImpl implements CompletionsProvider<CompletionEntryWithIdentifer> {
  constructor(private lang: LanguageServiceManager) {}

  async getCompletions(document: Document, position: Position, _completionContext?: CompletionContext): Promise<AppCompletionList<CompletionEntryWithIdentifer> | null> {
    // TODO: handle inside expression
    if (!isInsideFrontmatter(document.getText(), document.offsetAt(position))) {
      return null;
    }

    const filePath = document.getFilePath();
    if (!filePath) throw new Error();

    const { tsDoc, lang } = await this.lang.getTypeScriptDoc(document);
    const fragment = await tsDoc.getFragment();

    const offset = document.offsetAt(position);

    const entries = lang.getCompletionsAtPosition(fragment.filePath, offset, completionOptions)?.entries || [];

    const completionItems = entries
      .map((entry: ts.CompletionEntry) => this.toCompletionItem(fragment, entry, document.uri, position, new Set()))
      .filter((i) => i) as CompletionItem[];

    return CompletionList.create(completionItems, true);
  }

  async resolveCompletion(document: Document, completionItem: AppCompletionItem<CompletionEntryWithIdentifer>): Promise<AppCompletionItem<CompletionEntryWithIdentifer>> {
    const { data: comp } = completionItem;
    const { tsDoc, lang } = await this.lang.getTypeScriptDoc(document);

    let filePath = toVirtualAstroFilePath(tsDoc.filePath);

    if (!comp || !filePath) {
      return completionItem;
    }

    const fragment = await tsDoc.getFragment();
    const detail = lang.getCompletionEntryDetails(
      filePath, // fileName
      fragment.offsetAt(comp.position), // position
      comp.name, // entryName
      {}, // formatOptions
      comp.source, // source
      {}, // preferences
      comp.data // data
    );

    if (detail) {
      const { detail: itemDetail, documentation: itemDocumentation } = this.getCompletionDocument(detail);

      completionItem.detail = itemDetail;
      completionItem.documentation = itemDocumentation;
    }

    return completionItem;
  }

  private toCompletionItem(
    fragment: any,
    comp: ts.CompletionEntry,
    uri: string,
    position: Position,
    existingImports: Set<string>
  ): AppCompletionItem<CompletionEntryWithIdentifer> | null {
    return {
      label: comp.name,
      insertText: comp.insertText,
      kind: scriptElementKindToCompletionItemKind(comp.kind),
      commitCharacters: getCommitCharactersForScriptElement(comp.kind),
      // Make sure svelte component takes precedence
      sortText: comp.sortText,
      preselect: comp.isRecommended,
      // pass essential data for resolving completion
      data: {
        ...comp,
        uri,
        position,
      },
    };
  }

  private getCompletionDocument(compDetail: ts.CompletionEntryDetails) {
    const { source, documentation: tsDocumentation, displayParts, tags } = compDetail;
    let detail: string = ts.displayPartsToString(displayParts);

    if (source) {
      const importPath = ts.displayPartsToString(source);
      detail = `Auto import from ${importPath}\n${detail}`;
    }

    const documentation: MarkupContent | undefined = tsDocumentation ? { value: tsDocumentation.join('\n'), kind: MarkupKind.Markdown } : undefined;

    return {
      documentation,
      detail,
    };
  }
}
