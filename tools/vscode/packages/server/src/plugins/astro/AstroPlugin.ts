import type { Document, DocumentManager } from '../../core/documents';
import type { ConfigManager } from '../../core/config';
import type { CompletionsProvider, AppCompletionItem, AppCompletionList, FoldingRangeProvider } from '../interfaces';
import { CompletionContext, Position, CompletionList, CompletionItem, CompletionItemKind, InsertTextFormat, FoldingRange, TextEdit } from 'vscode-languageserver';
import { isPossibleClientComponent } from '../../utils';
import { FoldingRangeKind } from 'vscode-languageserver-types';

export class AstroPlugin implements CompletionsProvider, FoldingRangeProvider {
  private readonly docManager: DocumentManager;
  private readonly configManager: ConfigManager;

  constructor(docManager: DocumentManager, configManager: ConfigManager) {
    this.docManager = docManager;
    this.configManager = configManager;
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
      }
    ];
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
}
