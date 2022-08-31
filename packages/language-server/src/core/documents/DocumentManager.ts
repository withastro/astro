import { EventEmitter } from 'events';
import type {
	TextDocumentContentChangeEvent,
	TextDocumentItem,
	VersionedTextDocumentIdentifier,
} from 'vscode-languageserver';
import { AstroDocument } from './AstroDocument';
import { normalizeUri } from '../../utils';

export type DocumentEvent = 'documentOpen' | 'documentChange' | 'documentClose';

export class DocumentManager {
	private emitter = new EventEmitter();
	private openedInClient = new Set<string>();
	private documents: Map<string, AstroDocument> = new Map();
	private locked = new Set<string>();
	private deleteCandidates = new Set<string>();

	constructor(private createDocument?: (textDocument: Pick<TextDocumentItem, 'text' | 'uri'>) => AstroDocument) {
		if (!createDocument) {
			this.createDocument = (textDocument) => new AstroDocument(textDocument.uri, textDocument.text);
		}
	}

	openDocument(textDocument: Pick<TextDocumentItem, 'text' | 'uri'>): AstroDocument {
		textDocument = { ...textDocument, uri: normalizeUri(textDocument.uri) };

		let document: AstroDocument;
		if (this.documents.has(textDocument.uri)) {
			document = this.documents.get(textDocument.uri)!;
			document.setText(textDocument.text);
		} else {
			document = this.createDocument!(textDocument);
			this.documents.set(textDocument.uri, document);
			this.notify('documentOpen', document);
		}

		this.notify('documentChange', document);

		return document;
	}

	lockDocument(uri: string): void {
		this.locked.add(normalizeUri(uri));
	}

	markAsOpenedInClient(uri: string): void {
		this.openedInClient.add(normalizeUri(uri));
	}

	getAllOpenedByClient() {
		return Array.from(this.documents.entries()).filter((doc) => this.openedInClient.has(doc[0]));
	}

	releaseDocument(uri: string): void {
		uri = normalizeUri(uri);

		this.locked.delete(uri);
		this.openedInClient.delete(uri);
		if (this.deleteCandidates.has(uri)) {
			this.deleteCandidates.delete(uri);
			this.closeDocument(uri);
		}
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

	updateDocument(textDocument: VersionedTextDocumentIdentifier, changes: TextDocumentContentChangeEvent[]) {
		const document = this.documents.get(normalizeUri(textDocument.uri));
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

	on(name: DocumentEvent, listener: (document: AstroDocument) => void) {
		this.emitter.on(name, listener);
	}

	get(uri: string) {
		return this.documents.get(normalizeUri(uri));
	}

	private notify(name: DocumentEvent, document: AstroDocument) {
		this.emitter.emit(name, document);
	}

	static newInstance() {
		return new DocumentManager(({ uri, text }: { uri: string; text: string }) => new AstroDocument(uri, text));
	}
}
