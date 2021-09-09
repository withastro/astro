import { Connection, TextDocumentIdentifier, Diagnostic } from 'vscode-languageserver';
import { DocumentManager, Document } from './documents';

export type SendDiagnostics = Connection['sendDiagnostics'];
export type GetDiagnostics = (doc: TextDocumentIdentifier) => Thenable<Diagnostic[]>;

export class DiagnosticsManager {
    constructor(
        private sendDiagnostics: SendDiagnostics,
        private docManager: DocumentManager,
        private getDiagnostics: GetDiagnostics
    ) {}

    updateAll() {
        this.docManager.getAllOpenedByClient().forEach((doc) => {
            this.update(doc[1]);
        });
    }

    async update(document: Document) {
        const diagnostics = await this.getDiagnostics({ uri: document.getURL() });
        this.sendDiagnostics({
            uri: document.getURL(),
            diagnostics
        });
    }

    removeDiagnostics(document: Document) {
        this.sendDiagnostics({
            uri: document.getURL(),
            diagnostics: []
        });
    }
}