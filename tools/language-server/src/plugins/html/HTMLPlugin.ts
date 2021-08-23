import { CompletionsProvider, FoldingRangeProvider } from '../interfaces';
import { getEmmetCompletionParticipants, VSCodeEmmetConfig } from 'vscode-emmet-helper';
import { getLanguageService, HTMLDocument, CompletionItem as HtmlCompletionItem, Node, FoldingRange } from 'vscode-html-languageservice';
import { CompletionList, Position, CompletionItem, CompletionItemKind, TextEdit } from 'vscode-languageserver';
import type { Document, DocumentManager } from '../../core/documents';
import { isInsideExpression, isInsideFrontmatter } from '../../core/documents/utils';
import type { ConfigManager } from '../../core/config';

export class HTMLPlugin implements CompletionsProvider, FoldingRangeProvider {
  private lang = getLanguageService();
  private documents = new WeakMap<Document, HTMLDocument>();
  private styleScriptTemplate = new Set(['template', 'style', 'script']);
  private configManager: ConfigManager;
  public pluginName = 'HTML';

  constructor(docManager: DocumentManager, configManager: ConfigManager) {
    docManager.on('documentChange', (document) => {
      this.documents.set(document, document.html);
    });
    this.configManager = configManager;
  }

  getCompletions(document: Document, position: Position): CompletionList | null {
    const html = this.documents.get(document);

    if (!html) {
      return null;
    }

    if (this.isInsideFrontmatter(document, position) || this.isInsideExpression(html, document, position)) {
      return null;
    }

    const offset = document.offsetAt(position);
    const node = html.findNodeAt(offset);

    if (this.isComponentTag(node)) {
      return null;
    }

    const emmetResults: CompletionList = {
      isIncomplete: true,
      items: [],
    };
    this.lang.setCompletionParticipants([getEmmetCompletionParticipants(document, position, 'html', this.configManager.getEmmetConfig(), emmetResults)]);

    const results = this.lang.doComplete(document, position, html);
    const items = this.toCompletionItems(results.items);

    return CompletionList.create(
      [...this.toCompletionItems(items), ...this.getLangCompletions(items), ...emmetResults.items],
      // Emmet completions change on every keystroke, so they are never complete
      emmetResults.items.length > 0
    );
  }

  getFoldingRanges(document: Document): FoldingRange[] | null {
    const html = this.documents.get(document);
    if (!html) {
      return null;
    }

    return this.lang.getFoldingRanges(document);
  }

  doTagComplete(document: Document, position: Position): string | null {
    const html = this.documents.get(document);
    if (!html) {
      return null;
    }

    if (this.isInsideFrontmatter(document, position) || this.isInsideExpression(html, document, position)) {
      return null;
    }

    return this.lang.doTagComplete(document, position, html);
  }

  /**
   * The HTML language service uses newer types which clash
   * without the stable ones. Transform to the stable types.
   */
  private toCompletionItems(items: HtmlCompletionItem[]): CompletionItem[] {
    return items.map((item) => {
      if (!item.textEdit || TextEdit.is(item.textEdit)) {
        return item as CompletionItem;
      }
      return {
        ...item,
        textEdit: TextEdit.replace(item.textEdit.replace, item.textEdit.newText),
      };
    });
  }

  private getLangCompletions(completions: CompletionItem[]): CompletionItem[] {
    const styleScriptTemplateCompletions = completions.filter((completion) => completion.kind === CompletionItemKind.Property && this.styleScriptTemplate.has(completion.label));
    const langCompletions: CompletionItem[] = [];
    addLangCompletion('style', ['scss', 'sass']);
    return langCompletions;

    /** Add language completions */
    function addLangCompletion(tag: string, languages: string[]) {
      const existingCompletion = styleScriptTemplateCompletions.find((completion) => completion.label === tag);
      if (!existingCompletion) {
        return;
      }

      languages.forEach((lang) =>
        langCompletions.push({
          ...existingCompletion,
          label: `${tag} (lang="${lang}")`,
          insertText: existingCompletion.insertText && `${existingCompletion.insertText} lang="${lang}"`,
          textEdit:
            existingCompletion.textEdit && TextEdit.is(existingCompletion.textEdit)
              ? {
                  range: existingCompletion.textEdit.range,
                  newText: `${existingCompletion.textEdit.newText} lang="${lang}"`,
                }
              : undefined,
        })
      );
    }
  }

  private isInsideExpression(html: HTMLDocument, document: Document, position: Position) {
    const offset = document.offsetAt(position);
    const node = html.findNodeAt(offset);
    return isInsideExpression(document.getText(), node.start, offset);
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
}
