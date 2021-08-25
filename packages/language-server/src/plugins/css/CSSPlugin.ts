import type { CompletionsProvider } from '../interfaces';
import type { Document, DocumentManager } from '../../core/documents';
import type { ConfigManager } from '../../core/config';
import { getEmmetCompletionParticipants, doComplete as doEmmetComplete } from 'vscode-emmet-helper';
import { CompletionContext, CompletionList, CompletionTriggerKind, Position } from 'vscode-languageserver';
import { isInsideFrontmatter } from '../../core/documents/utils';
import { CSSDocument, CSSDocumentBase } from './CSSDocument';
import { getLanguage, getLanguageService } from './service';
import { StyleAttributeDocument } from './StyleAttributeDocument';
import { mapCompletionItemToOriginal } from '../../core/documents';
import { AttributeContext, getAttributeContextAtPosition } from '../../core/documents/parseHtml';
import { getIdClassCompletion } from './features/getIdClassCompletion';

export class CSSPlugin implements CompletionsProvider {
  private docManager: DocumentManager;
  private configManager: ConfigManager;
  private documents = new WeakMap<Document, CSSDocument>();
  private triggerCharacters = new Set(['.', ':', '-', '/']);
  public pluginName = 'CSS';

  constructor(docManager: DocumentManager, configManager: ConfigManager) {
    this.docManager = docManager;
    this.configManager = configManager;

    this.docManager.on('documentChange', (document) => {
      this.documents.set(document, new CSSDocument(document));
    });
  }

  getCompletions(document: Document, position: Position, completionContext?: CompletionContext): CompletionList | null {
    const triggerCharacter = completionContext?.triggerCharacter;
    const triggerKind = completionContext?.triggerKind;
    const isCustomTriggerCharacter = triggerKind === CompletionTriggerKind.TriggerCharacter;

    if (isCustomTriggerCharacter && triggerCharacter && !this.triggerCharacters.has(triggerCharacter)) {
      return null;
    }

    if (this.isInsideFrontmatter(document, position)) {
      return null;
    }

    const cssDocument = this.getCSSDoc(document);

    if (cssDocument.isInGenerated(position)) {
      return this.getCompletionsInternal(document, position, cssDocument);
    }

    const attributeContext = getAttributeContextAtPosition(document, position);
    if (!attributeContext) {
      return null;
    }

    if (this.inStyleAttributeWithoutInterpolation(attributeContext, document.getText())) {
      const [start, end] = attributeContext.valueRange;
      return this.getCompletionsInternal(document, position, new StyleAttributeDocument(document, start, end));
    } else {
      return getIdClassCompletion(cssDocument, attributeContext);
    }
  }

  private getCompletionsInternal(document: Document, position: Position, cssDocument: CSSDocumentBase) {
    if (isSASS(cssDocument)) {
      // the css language service does not support sass, still we can use
      // the emmet helper directly to at least get emmet completions
      return doEmmetComplete(document, position, 'sass', this.configManager.getEmmetConfig());
    }

    const type = extractLanguage(cssDocument);

    const lang = getLanguageService(type);
    const emmetResults: CompletionList = {
      isIncomplete: true,
      items: [],
    };
    if (false /* this.configManager.getConfig().css.completions.emmet */) {
      lang.setCompletionParticipants([
        getEmmetCompletionParticipants(cssDocument, cssDocument.getGeneratedPosition(position), getLanguage(type), this.configManager.getEmmetConfig(), emmetResults),
      ]);
    }
    const results = lang.doComplete(cssDocument, cssDocument.getGeneratedPosition(position), cssDocument.stylesheet);
    return CompletionList.create(
      [...(results ? results.items : []), ...emmetResults.items].map((completionItem) => mapCompletionItemToOriginal(cssDocument, completionItem)),
      // Emmet completions change on every keystroke, so they are never complete
      emmetResults.items.length > 0
    );
  }

  private inStyleAttributeWithoutInterpolation(attrContext: AttributeContext, text: string): attrContext is Required<AttributeContext> {
    return attrContext.name === 'style' && !!attrContext.valueRange && !text.substring(attrContext.valueRange[0], attrContext.valueRange[1]).includes('{');
  }

  private getCSSDoc(document: Document) {
    let cssDoc = this.documents.get(document);
    if (!cssDoc || cssDoc.version < document.version) {
      cssDoc = new CSSDocument(document);
      this.documents.set(document, cssDoc);
    }
    return cssDoc;
  }

  private isInsideFrontmatter(document: Document, position: Position) {
    return isInsideFrontmatter(document.getText(), document.offsetAt(position));
  }
}

function isSASS(document: CSSDocumentBase) {
  switch (extractLanguage(document)) {
    case 'sass':
      return true;
    default:
      return false;
  }
}

function extractLanguage(document: CSSDocumentBase): string {
  const lang = document.languageId;
  return lang.replace(/^text\//, '');
}
