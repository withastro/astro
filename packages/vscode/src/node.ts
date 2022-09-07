import * as path from 'path';
import { ExtensionContext, Position, TextDocument, Uri, workspace } from 'vscode';
import { LanguageClientOptions, RequestType, TextDocumentPositionParams } from 'vscode-languageclient';
import { LanguageClient, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import * as tsVersion from './features/typescriptVersion';
import { activateTagClosing } from './html/autoClose';
import { commonActivate, getInitOptions } from './shared';

const TagCloseRequest: RequestType<TextDocumentPositionParams, string, any> = new RequestType('html/tag');

export async function activate(context: ExtensionContext) {
	const runtimeConfig = workspace.getConfiguration('astro.language-server');

	const { workspaceFolders } = workspace;
	const rootPath = workspaceFolders?.[0].uri.fsPath;

	let lsPath = runtimeConfig.get<string>('ls-path');
	if (typeof lsPath === 'string' && lsPath.trim() !== '' && typeof rootPath === 'string') {
		lsPath = path.isAbsolute(lsPath) ? lsPath : path.join(rootPath, lsPath);
		console.info(`Using language server at ${lsPath}`);
	} else {
		lsPath = undefined;
	}

	const serverModule = lsPath
		? require.resolve(lsPath)
		: Uri.joinPath(context.extensionUri, 'dist/node/server.js').fsPath;

	const port = 6040;
	const debugOptions = { execArgv: ['--nolazy', '--inspect=' + port] };

	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions,
		},
	};

	const serverRuntime = runtimeConfig.get<string>('runtime');
	if (serverRuntime) {
		serverOptions.run.runtime = serverRuntime;
		serverOptions.debug.runtime = serverRuntime;
		console.info(`Using ${serverRuntime} as runtime`);
	}

	const typescript = tsVersion.getCurrentTsPaths(context);
	const clientOptions = getInitOptions('node', typescript);
	let client = createLanguageServer(serverOptions, clientOptions);

	client
		.start()
		.then(() => {
			const tagRequestor = (document: TextDocument, position: Position) => {
				const param = client.code2ProtocolConverter.asTextDocumentPositionParams(document, position);
				return client.sendRequest(TagCloseRequest, param);
			};
			const disposable = activateTagClosing(tagRequestor, { astro: true }, 'html.autoClosingTags');
			context.subscriptions.push(disposable);
		})
		.catch((err) => {
			console.error('Astro, unable to load language server.', err);
		});

	commonActivate(context, client, tsVersion);

	return {
		getLanguageServer: () => client,
	};
}

function createLanguageServer(serverOptions: ServerOptions, clientOptions: LanguageClientOptions) {
	return new LanguageClient('astro', 'Astro', serverOptions, clientOptions);
}
