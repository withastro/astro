import { RequestType, TextDocumentPositionParams, createConnection, ProposedFeatures, TextDocumentSyncKind, TextDocumentIdentifier } from 'vscode-languageserver';
import { Document, DocumentManager } from './core/documents';
import { ConfigManager } from './core/config';
import { PluginHost, HTMLPlugin, TypeScriptPlugin, AppCompletionItem, AstroPlugin } from './plugins';
import { urlToPath } from './utils';

const TagCloseRequest: RequestType<TextDocumentPositionParams, string | null, any> = new RequestType('html/tag');

/**
 * Starts `astro-languageservice`
 */
export function startServer() {
  let connection = createConnection(ProposedFeatures.all);

  const docManager = new DocumentManager(({ uri, text }: { uri: string; text: string }) => new Document(uri, text));
  const configManager = new ConfigManager();
  const pluginHost = new PluginHost(docManager);

  connection.onInitialize((evt) => {
    const workspaceUris = evt.workspaceFolders?.map((folder) => folder.uri.toString()) ?? [evt.rootUri ?? ''];

    pluginHost.register(new AstroPlugin(docManager, configManager));
    pluginHost.register(new HTMLPlugin(docManager, configManager));
    pluginHost.register(new TypeScriptPlugin(docManager, configManager, workspaceUris));
    configManager.updateEmmetConfig(evt.initializationOptions?.configuration?.emmet || evt.initializationOptions?.emmetConfig || {});

    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        foldingRangeProvider: true,
        completionProvider: {
          resolveProvider: true,
          triggerCharacters: [
            '.',
            '"',
            "'",
            '`',
            '/',
            '@',
            '<',

            // Emmet
            '>',
            '*',
            '#',
            '$',
            '+',
            '^',
            '(',
            '[',
            '@',
            '-',
            // No whitespace because
            // it makes for weird/too many completions
            // of other completion providers

            // Astro
            ':',
          ],
        },
      },
    };
  });

  // Documents
  connection.onDidOpenTextDocument((evt) => {
    docManager.openDocument(evt.textDocument);
    docManager.markAsOpenedInClient(evt.textDocument.uri);
  });

  connection.onDidCloseTextDocument((evt) => docManager.closeDocument(evt.textDocument.uri));

  connection.onDidChangeTextDocument((evt) => {
    docManager.updateDocument(evt.textDocument.uri, evt.contentChanges);
  });

  connection.onDidChangeWatchedFiles((evt) => {
    const params = evt.changes
      .map((change) => ({
        fileName: urlToPath(change.uri),
        changeType: change.type,
      }))
      .filter((change) => !!change.fileName);

    pluginHost.onWatchFileChanges(params);
  });

  // Config
  connection.onDidChangeConfiguration(({ settings }) => {
    configManager.updateEmmetConfig(settings.emmet);
  });

  // Features
  connection.onCompletion((evt) => pluginHost.getCompletions(evt.textDocument, evt.position, evt.context));
  connection.onCompletionResolve((completionItem) => {
    const data = (completionItem as AppCompletionItem).data as TextDocumentIdentifier;

    if (!data) {
      return completionItem;
    }

    return pluginHost.resolveCompletion(data, completionItem);
  });
  connection.onFoldingRanges((evt) => pluginHost.getFoldingRanges(evt.textDocument));
  connection.onRequest(TagCloseRequest, (evt: any) => pluginHost.doTagComplete(evt.textDocument, evt.position));

  connection.listen();
}
