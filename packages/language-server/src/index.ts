import { RequestType, TextDocumentPositionParams, createConnection, ProposedFeatures, TextDocumentSyncKind, TextDocumentIdentifier } from 'vscode-languageserver';
import { Document, DocumentManager } from './core/documents';
import { ConfigManager } from './core/config';
import { PluginHost, CSSPlugin, HTMLPlugin, TypeScriptPlugin, AppCompletionItem, AstroPlugin } from './plugins';
import { DiagnosticsManager } from './core/DiagnosticsManager';
import { debounceThrottle, urlToPath } from './utils';

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

    pluginHost.initialize({
      filterIncompleteCompletions: !evt.initializationOptions?.dontFilterIncompleteCompletions,
      definitionLinkSupport: !!evt.capabilities.textDocument?.definition?.linkSupport,
    });
    pluginHost.register(new HTMLPlugin(docManager, configManager));
    pluginHost.register(new CSSPlugin(docManager, configManager));
    pluginHost.register(new TypeScriptPlugin(docManager, configManager, workspaceUris));
    pluginHost.register(new AstroPlugin(docManager, configManager, workspaceUris));
    configManager.update(
      evt.initializationOptions?.configuration?.astro?.plugin ||
          evt.initializationOptions?.config ||
          {}
    );
    configManager.updateTsJsUserPreferences(
      evt.initializationOptions?.configuration ||
          evt.initializationOptions?.typescriptConfig ||
          {}
    );
    configManager.updateEmmetConfig(evt.initializationOptions?.configuration?.emmet || evt.initializationOptions?.emmetConfig || {});

    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        foldingRangeProvider: true,
        definitionProvider: true,
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
            ' ',

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
        hoverProvider: true,
        signatureHelpProvider: {
          triggerCharacters: ['(', ',', '<'],
          retriggerCharacters: [')'],
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

  const diagnosticsManager = new DiagnosticsManager(
      connection.sendDiagnostics,
      docManager,
      pluginHost.getDiagnostics.bind(pluginHost)
  );

  const updateAllDiagnostics = debounceThrottle(() => diagnosticsManager.updateAll(), 1000);

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
    updateAllDiagnostics();
  });

  //connection.onDidChangeTextDocument(updateAllDiagnostics);

  // Config
  connection.onDidChangeConfiguration(({ settings }) => {
    configManager.update(settings.astro?.plugin);
    configManager.updateEmmetConfig(settings.emmet);
    configManager.updateTsJsUserPreferences(settings);
  });

  // Features
  connection.onCompletion(async (evt) => {
    const promise = pluginHost.getCompletions(evt.textDocument, evt.position, evt.context);
    return promise;
  });
  connection.onCompletionResolve((completionItem) => {
    const data = (completionItem as AppCompletionItem).data as TextDocumentIdentifier;

    if (!data) {
      return completionItem;
    }

    return pluginHost.resolveCompletion(data, completionItem);
  });
  connection.onHover((evt) => pluginHost.doHover(evt.textDocument, evt.position));
  connection.onDefinition((evt) => pluginHost.getDefinitions(evt.textDocument, evt.position));
  connection.onFoldingRanges((evt) => pluginHost.getFoldingRanges(evt.textDocument));
  connection.onRequest(TagCloseRequest, (evt: any) => pluginHost.doTagComplete(evt.textDocument, evt.position));
  connection.onSignatureHelp((evt, cancellationToken) => pluginHost.getSignatureHelp(evt.textDocument, evt.position, evt.context, cancellationToken));

  docManager.on(
      'documentChange',
      debounceThrottle(async (document: Document) => diagnosticsManager.update(document), 1000)
  );
  docManager.on('documentClose', (document: Document) =>
      diagnosticsManager.removeDiagnostics(document)
  );

  connection.listen();
}
