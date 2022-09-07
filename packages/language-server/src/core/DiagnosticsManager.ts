import type { Connection, Diagnostic, TextDocumentIdentifier } from 'vscode-languageserver';
import type { AstroDocument, DocumentManager } from './documents';

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

	async update(document: AstroDocument) {
		const diagnostics = await this.getDiagnostics({ uri: document.getURL() });
		this.sendDiagnostics({
			uri: document.getURL(),
			diagnostics,
		});
	}

	removeDiagnostics(document: AstroDocument) {
		this.sendDiagnostics({
			uri: document.getURL(),
			diagnostics: [],
		});
	}
}
