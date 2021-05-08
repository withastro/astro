import * as path from 'path';
import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient/node';
import { activateTagClosing } from './html/autoClose';

let docClient: lsp.LanguageClient;

const TagCloseRequest: lsp.RequestType<lsp.TextDocumentPositionParams, string, any> = new lsp.RequestType('html/tag');

/**  */
export async function activate(context: vscode.ExtensionContext) {
  docClient = createLanguageService(context, 'doc', 'astro', 'Astro', 6040);

  await docClient.onReady();
}

/**  */
function createLanguageService(context: vscode.ExtensionContext, mode: 'doc', id: string, name: string, port: number) {
  const { workspace } = vscode;
  const serverModule = require.resolve('astro-languageserver/bin/server.js');
  const debugOptions = { execArgv: ['--nolazy', '--inspect=' + port] };
  const serverOptions: lsp.ServerOptions = {
    run: { module: 'astro-languageserver', transport: lsp.TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: lsp.TransportKind.ipc,
      options: debugOptions,
    },
  };
  const serverInitOptions: any = {
    mode: mode,
    appRoot: vscode.env.appRoot,
    language: vscode.env.language,
  };
  const clientOptions: lsp.LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'astro' }],
    synchronize: {
      configurationSection: ['javascript', 'typescript', 'prettier'],
      fileEvents: workspace.createFileSystemWatcher('{**/*.js,**/*.ts}', false, false, false),
    },
    initializationOptions: {
      ...serverInitOptions,
      configuration: {
        prettier: workspace.getConfiguration('prettier'),
        emmet: workspace.getConfiguration('emmet'),
        typescript: workspace.getConfiguration('typescript'),
        javascript: workspace.getConfiguration('javascript'),
      },
      dontFilterIncompleteCompletions: true, // VSCode filters client side and is smarter at it than us
    },
  };
  const client = new lsp.LanguageClient(id, name, serverOptions, clientOptions);

  context.subscriptions.push(client.start());

  client.onReady().then(() => {
    const tagRequestor = (document: vscode.TextDocument, position: vscode.Position) => {
      const param = client.code2ProtocolConverter.asTextDocumentPositionParams(document, position);
      return client.sendRequest(TagCloseRequest, param);
    };
    const disposable = activateTagClosing(tagRequestor, { astro: true }, 'html.autoClosingTags');
    context.subscriptions.push(disposable);
  }).catch(err => {
    console.error('Astro, unable to load language server.', err);
  });

  return client;
}
