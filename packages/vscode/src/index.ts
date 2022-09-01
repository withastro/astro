import * as path from 'path';
import {
	window,
	commands,
	workspace,
	ExtensionContext,
	TextDocument,
	Position,
	TextDocumentChangeEvent,
	ViewColumn,
	ConfigurationChangeEvent,
} from 'vscode';
import {
	LanguageClient,
	RequestType,
	TextDocumentPositionParams,
	ServerOptions,
	TransportKind,
} from 'vscode-languageclient/node';
import { LanguageClientOptions } from 'vscode-languageclient';
import { activateTagClosing } from './html/autoClose.js';
import * as tsVersion from './features/typescriptVersion';

const TagCloseRequest: RequestType<TextDocumentPositionParams, string, any> = new RequestType('html/tag');

let client: LanguageClient;

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

	const serverModule = require.resolve(lsPath ?? '@astrojs/language-server/bin/nodeServer.js');

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
	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'astro' }],
		synchronize: {
			fileEvents: workspace.createFileSystemWatcher('{**/*.js,**/*.ts}', false, false, false),
		},
		initializationOptions: {
			environment: 'node',
			typescript,
			dontFilterIncompleteCompletions: true, // VSCode filters client side and is smarter at it than us
			isTrusted: workspace.isTrusted,
		},
	};

	client = createLanguageServer(serverOptions, clientOptions);

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

	workspace.onDidChangeConfiguration((e: ConfigurationChangeEvent) =>
		tsVersion.onDidChangeConfiguration(e, context, client)
	);

	// Restart the language server if any critical files that are outside our jurisdiction got changed (tsconfig, jsconfig etc)
	workspace.onDidSaveTextDocument(async (doc: TextDocument) => {
		const fileName = doc.fileName.split(/\/|\\/).pop() ?? doc.fileName;
		if ([/^tsconfig\.json$/, /^jsconfig\.json$/].some((regex) => regex.test(fileName))) {
			await restartClient(false);
		}
	});

	workspace.onDidChangeTextDocument((params: TextDocumentChangeEvent) => {
		if (
			['vue', 'svelte', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'json', 'jsonc'].includes(
				params.document.languageId
			)
		) {
			// For [j|t]sconfig, we currently handle updates by restarting the client as we need to rebuild the TypeScript
			// language service whenever the config changes. In the future the server will handle this by itself, but for now
			// we can't update the snapshot for those files without causing an error since the client tries to
			// reload and send the notification at the same time
			const fileName = params.document.fileName.split(/\/|\\/).pop() ?? params.document.fileName;
			if (
				['json', 'jsonc'].includes(params.document.languageId) &&
				(fileName.startsWith('tsconfig') || fileName.startsWith('jsconfig'))
			) {
				return;
			}

			getLSClient().sendNotification('$/onDidChangeNonAstroFile', {
				uri: params.document.uri.toString(true),
				// Partial changes are not supported for Vue and Svelte files
				changes: ['vue', 'svelte'].includes(params.document.languageId)
					? undefined
					: params.contentChanges.map((c) => ({
							range: {
								start: { line: c.range.start.line, character: c.range.start.character },
								end: { line: c.range.end.line, character: c.range.end.character },
							},
							text: c.text,
					  })),
			});
		}
	});

	context.subscriptions.push(
		commands.registerCommand('astro.restartLanguageServer', async (showNotification = true) => {
			await restartClient(showNotification);
		}),
		commands.registerCommand('astro.showTSXOutput', async () => {
			const content = await getLSClient().sendRequest<string | undefined>(
				'$/getTSXOutput',
				window.activeTextEditor?.document.uri.toString()
			);

			if (content) {
				const document = await workspace.openTextDocument({ content, language: 'typescriptreact' });

				await window.showTextDocument(document, {
					preview: true,
					viewColumn: ViewColumn.Beside,
				});
			} else {
				window.showErrorMessage("Could not open the current document's TSX output");
			}
		}),
		commands.registerCommand('astro.selectTypescriptVersion', () => tsVersion.selectVersionCommand(context, client))
	);

	let restartingClient = false;
	async function restartClient(showNotification: boolean) {
		if (restartingClient) {
			return;
		}

		restartingClient = true;

		await client.stop();
		await client.start();

		if (showNotification) {
			window.showInformationMessage('Astro language server restarted.');
		}

		restartingClient = false;
	}

	function getLSClient() {
		return client;
	}

	return {
		getLanguageServer: getLSClient,
	};
}

export function deactivate(): Promise<void> | undefined {
	if (!client) {
		return undefined;
	}

	return client.stop();
}

function createLanguageServer(serverOptions: ServerOptions, clientOptions: LanguageClientOptions) {
	return new LanguageClient('astro', 'Astro', serverOptions, clientOptions);
}
