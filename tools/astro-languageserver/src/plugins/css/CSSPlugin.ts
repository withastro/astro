import type { CompletionsProvider, FoldingRangeProvider } from '../interfaces';
import type { Document, DocumentManager } from '../../core/documents';
import type { ConfigManager } from '../../core/config';
import { CompletionList, Position } from 'vscode-languageserver';
import { isInsideExpression, isInsideFrontmatter } from '../../core/documents/utils';

export class CSSPlugin implements CompletionsProvider {
  private docManager: DocumentManager;
  private configManager: ConfigManager;

  constructor(docManager: DocumentManager, configManager: ConfigManager) {
    docManager.on('documentChange', (document) => {
      //this.documents.set(document, document.html);
    });

    this.docManager = docManager;
    this.configManager = configManager;
  }

  getCompletions(document: Document, position: Position): CompletionList | null {


    return null;
  }

  private isInsideFrontmatter(document: Document, position: Position) {
    return isInsideFrontmatter(document.getText(), document.offsetAt(position));
  }
}