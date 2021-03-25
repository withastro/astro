import * as path from 'path';
import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient/node';

import * as defaultSettings from './features/defaultSettings.js';

let docClient: lsp.LanguageClient;

export async function activate(context: vscode.ExtensionContext) {
  docClient = createLanguageService(context, 'doc', 'astro', 'Astro', 6040);

  defaultSettings.activate();

  await docClient.onReady();
  startEmbeddedLanguageServices();
}

function createLanguageService(context: vscode.ExtensionContext, mode: 'doc', id: string, name: string, port: number) {
  const serverModule = context.asAbsolutePath(path.join('dist', 'server.js'));
  const debugOptions = { execArgv: ['--nolazy', '--inspect=' + port] };
  const serverOptions: lsp.ServerOptions = {
    run: { module: serverModule, transport: lsp.TransportKind.ipc },
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
    initializationOptions: serverInitOptions,
  };
  const client = new lsp.LanguageClient(id, name, serverOptions, clientOptions);
  context.subscriptions.push(client.start());

  return client;
}

async function startEmbeddedLanguageServices() {
  const ts = vscode.extensions.getExtension('vscode.typescript-language-features');
  const css = vscode.extensions.getExtension('vscode.css-language-features');
  const html = vscode.extensions.getExtension('vscode.html-language-features');

  if (ts && !ts.isActive) {
    await ts.activate();
  }
  if (css && !css.isActive) {
    await css.activate();
  }
  if (html && !html.isActive) {
    await html.activate();
  }

  /* from html-language-features */
  const EMPTY_ELEMENTS: string[] = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'];
  vscode.languages.setLanguageConfiguration('astro', {
    indentationRules: {
      increaseIndentPattern: /<(?!\?|(?:area|base|br|col|frame|hr|html|img|input|link|meta|param)\b|[^>]*\/>)([-_\.A-Za-z0-9]+)(?=\s|>)\b[^>]*>(?!.*<\/\1>)|<!--(?!.*-->)|\{[^}"']*$/,
      decreaseIndentPattern: /^\s*(<\/(?!html)[-_\.A-Za-z0-9]+\b[^>]*>|-->|\})/,
    },
    wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/g,
    onEnterRules: [
      {
        beforeText: new RegExp(`<(?!(?:${EMPTY_ELEMENTS.join('|')}))([_:\\w][_:\\w-.\\d]*)([^/>]*(?!/)>)[^<]*$`, 'i'),
        afterText: /^<\/([_:\w][_:\w-.\d]*)\s*>/i,
        action: { indentAction: vscode.IndentAction.IndentOutdent },
      },
      {
        beforeText: new RegExp(`<(?!(?:${EMPTY_ELEMENTS.join('|')}))(\\w[\\w\\d]*)([^/>]*(?!/)>)[^<]*$`, 'i'),
        action: { indentAction: vscode.IndentAction.Indent },
      },
    ],
  });
}
