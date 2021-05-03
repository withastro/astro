import { EventEmitter } from 'events';
import { TextDocumentContentChangeEvent, TextDocumentItem } from 'vscode-languageserver';
import { Document } from './Document';
import { normalizeUri } from '../../utils';

export type DocumentEvent = 'documentOpen' | 'documentChange' | 'documentClose';

export class DocumentManager {
  private emitter = new EventEmitter();
  private openedInClient = new Set<string>();
  private documents: Map<string, Document> = new Map();
  private locked = new Set<string>();
  private deleteCandidates = new Set<string>();

  constructor(private createDocument: (textDocument: { uri: string; text: string }) => Document) {}

  get(uri: string) {
    return this.documents.get(normalizeUri(uri));
  }

  openDocument(textDocument: TextDocumentItem) {
    let document: Document;
    if (this.documents.has(textDocument.uri)) {
      document = this.get(textDocument.uri) as Document;
      document.setText(textDocument.text);
    } else {
      document = this.createDocument(textDocument);
      this.documents.set(normalizeUri(textDocument.uri), document);
      this.notify('documentOpen', document);
    }

    this.notify('documentChange', document);

    return document;
  }

  closeDocument(uri: string) {
    uri = normalizeUri(uri);

    const document = this.documents.get(uri);
    if (!document) {
      throw new Error('Cannot call methods on an unopened document');
    }

    this.notify('documentClose', document);

    // Some plugin may prevent a document from actually being closed.
    if (!this.locked.has(uri)) {
      this.documents.delete(uri);
    } else {
      this.deleteCandidates.add(uri);
    }

    this.openedInClient.delete(uri);
  }

  updateDocument(uri: string, changes: TextDocumentContentChangeEvent[]) {
    const document = this.documents.get(normalizeUri(uri));
    if (!document) {
      throw new Error('Cannot call methods on an unopened document');
    }

    for (const change of changes) {
      let start = 0;
      let end = 0;
      if ('range' in change) {
        start = document.offsetAt(change.range.start);
        end = document.offsetAt(change.range.end);
      } else {
        end = document.getTextLength();
      }

      document.update(change.text, start, end);
    }

    this.notify('documentChange', document);
  }

  markAsOpenedInClient(uri: string) {
    this.openedInClient.add(normalizeUri(uri));
  }

  getAllOpenedByClient() {
    return Array.from(this.documents.entries()).filter((doc) => this.openedInClient.has(doc[0]));
  }

  on(name: DocumentEvent, listener: (document: Document) => void) {
    this.emitter.on(name, listener);
  }

  private notify(name: DocumentEvent, document: Document) {
    this.emitter.emit(name, document);
  }
}
