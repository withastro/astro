import type { Diagnostic } from 'vscode-languageserver';
import { DocumentManager } from './core/documents';
import { ConfigManager } from './core/config';
import { PluginHost, TypeScriptPlugin } from './plugins';
export { DiagnosticSeverity } from 'vscode-languageserver-protocol';

interface GetDiagnosticsResult {
  filePath: string;
  text: string;
  diagnostics: Diagnostic[]
}

export class AstroCheck {
  private docManager = DocumentManager.newInstance();
  private configManager = new ConfigManager();
  private pluginHost = new PluginHost(this.docManager);

  constructor(workspacePath: string) {
    this.initialize(workspacePath);
  }

  upsertDocument(doc: { text: string; uri: string }) {
    this.docManager.openDocument({
      text: doc.text,
      uri: doc.uri
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

  private initialize(workspacePath: string) { 
    this.pluginHost.register(new TypeScriptPlugin(
      this.docManager, this.configManager, [workspacePath]
    ));
  }

  private async getDiagnosticsForFile(uri: string) {
    const diagnostics = await this.pluginHost.getDiagnostics({ uri });
    return {
        filePath: new URL(uri).pathname || '',
        text: this.docManager.get(uri)?.getText() || '',
        diagnostics
    };
}
}