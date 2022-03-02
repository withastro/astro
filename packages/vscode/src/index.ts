import { window, commands, workspace, ExtensionContext, TextDocument, Position } from 'vscode';
import { LanguageClient, RequestType, TextDocumentPositionParams, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { LanguageClientOptions } from 'vscode-languageclient';
import { activateTagClosing } from './html/autoClose.js';

const TagCloseRequest: RequestType<TextDocumentPositionParams, string, any> = new RequestType('html/tag');

export async function activate(context: ExtensionContext) {
	const serverModule = require.resolve('@astrojs/language-server/bin/server.js');

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

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'astro' }],
		synchronize: {
			configurationSection: ['astro', 'javascript', 'typescript', 'prettier'],
			fileEvents: workspace.createFileSystemWatcher('{**/*.js,**/*.ts}', false, false, false),
		},
		initializationOptions: {
			configuration: {
				astro: workspace.getConfiguration('astro'),
				prettier: workspace.getConfiguration('prettier'),
				emmet: workspace.getConfiguration('emmet'),
				typescript: workspace.getConfiguration('typescript'),
				javascript: workspace.getConfiguration('javascript'),
			},
			dontFilterIncompleteCompletions: true, // VSCode filters client side and is smarter at it than us
		},
	};

	let client = createLanguageServer(serverOptions, clientOptions);
	context.subscriptions.push(client.start());

	client
		.onReady()
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

	// Restart the language server if any critical files that are outside our jurisdiction got changed (tsconfig, jsconfig etc)
	workspace.onDidSaveTextDocument(async (doc: TextDocument) => {
		const fileName = doc.fileName.split('/').pop() ?? doc.fileName;
		if ([/^tsconfig\.json$/, /^jsconfig\.json$/, /^astro\.config\.(js|cjs|mjs|ts)$/].some((regex) => regex.test(fileName))) {
			await restartClient(false);
		}
	});

	context.subscriptions.push(
		commands.registerCommand('astro.restartLanguageServer', async () => {
			await restartClient(true);
		})
	);

	let restartingClient = false;
	async function restartClient(showNotification: boolean) {
		if (restartingClient) {
			return;
		}

		restartingClient = true;
		await client.stop();

		client = createLanguageServer(serverOptions, clientOptions);
		context.subscriptions.push(client.start());
		await client.onReady();

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

function createLanguageServer(serverOptions: ServerOptions, clientOptions: LanguageClientOptions) {
	return new LanguageClient('astro', 'Astro', serverOptions, clientOptions);
}
