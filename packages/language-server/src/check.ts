import type { Diagnostic } from 'vscode-languageserver-types';
import { ConfigManager, LSConfig } from './core/config';
import { DocumentManager } from './core/documents';
import { PluginHost, TypeScriptPlugin } from './plugins';
import { LanguageServiceManager } from './plugins/typescript/LanguageServiceManager';
import { normalizeUri } from './utils';
export { DiagnosticSeverity } from 'vscode-languageserver-types';
export { Diagnostic };

export interface GetDiagnosticsResult {
	fileUri: string;
	text: string;
	diagnostics: Diagnostic[];
}

export class AstroCheck {
	private docManager = DocumentManager.newInstance();
	private configManager = new ConfigManager();
	private pluginHost = new PluginHost(this.docManager);

	constructor(workspacePath: string, typescriptPath: string, options?: LSConfig) {
		try {
			const ts = require(typescriptPath);
			this.initialize(workspacePath, ts);
		} catch (e) {
			throw new Error(`Couldn't load TypeScript from path ${typescriptPath}`);
		}

		if (options) {
			this.configManager.updateGlobalConfig(options);
		}
	}

	upsertDocument(doc: { text: string; uri: string }) {
		this.docManager.openDocument({
			text: doc.text,
			uri: doc.uri,
		});
		this.docManager.markAsOpenedInClient(doc.uri);
	}

	removeDocument(uri: string): void {
		if (!this.docManager.get(uri)) {
			return;
		}

		this.docManager.closeDocument(uri);
		this.docManager.releaseDocument(uri);
	}

	async getDiagnostics(): Promise<GetDiagnosticsResult[]> {
		return await Promise.all(
			this.docManager.getAllOpenedByClient().map(async (doc) => {
				const uri = doc[1].uri;
				return await this.getDiagnosticsForFile(uri);
			})
		);
	}

	private initialize(workspacePath: string, ts: typeof import('typescript/lib/tsserverlibrary')) {
		const languageServiceManager = new LanguageServiceManager(
			this.docManager,
			[normalizeUri(workspacePath)],
			this.configManager,
			ts
		);
		this.pluginHost.registerPlugin(new TypeScriptPlugin(this.configManager, languageServiceManager));
	}

	private async getDiagnosticsForFile(uri: string) {
		const diagnostics = await this.pluginHost.getDiagnostics({ uri });
		return {
			fileUri: uri || '',
			text: this.docManager.get(uri)?.getText() || '',
			diagnostics,
		};
	}
}
