import { RequestType, TextDocumentPositionParams, createConnection, ProposedFeatures, TextDocumentSyncKind, TextDocumentIdentifier } from 'vscode-languageserver';
import { Document, DocumentManager } from './core/documents';
import { ConfigManager } from './core/config';
import { PluginHost, HTMLPlugin, AppCompletionItem } from './plugins';

const TagCloseRequest: RequestType<
        TextDocumentPositionParams,
        string | null,
        any
    > = new RequestType('html/tag');

/**  */
export function startServer() {
  let connection = createConnection(ProposedFeatures.all);

  const docManager = new DocumentManager(
    ({ uri, text }: { uri: string, text: string }) => new Document(uri, text)
  );
  const configManager = new ConfigManager();
  const pluginHost = new PluginHost(docManager);
  pluginHost.register(new HTMLPlugin(docManager, configManager));

  connection.onInitialize((evt) => {
    configManager.updateEmmetConfig(
        evt.initializationOptions?.configuration?.emmet ||
            evt.initializationOptions?.emmetConfig ||
            {}
    );
    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        completionProvider: {
          resolveProvider: false,
        },
      },
    };
  });

  // Documents
  connection.onDidOpenTextDocument((evt) => {
    docManager.openDocument(evt.textDocument);
    docManager.markAsOpenedInClient(evt.textDocument.uri);
  })

  connection.onDidCloseTextDocument((evt) => docManager.closeDocument(evt.textDocument.uri));

  connection.onDidChangeTextDocument((evt) =>
    docManager.updateDocument(evt.textDocument.uri, evt.contentChanges)
  );

  // Config
  connection.onDidChangeConfiguration(({ settings }) => {
      configManager.updateEmmetConfig(settings.emmet);
  });

  // Features
  connection.onCompletion((evt) =>
    pluginHost.getCompletions(evt.textDocument, evt.position, evt.context)
  );
  connection.onCompletionResolve((completionItem) => {
    const data = (completionItem as AppCompletionItem).data as TextDocumentIdentifier;

      if (!data) {
          return completionItem;
      }

      return pluginHost.resolveCompletion(data, completionItem);
  });
  connection.onRequest(TagCloseRequest, (evt: any) =>
    pluginHost.doTagComplete(evt.textDocument, evt.position)
  );

  connection.listen();
}

startServer();
