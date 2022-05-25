import {
	commands,
	ExtensionContext,
	extensions,
	IndentAction,
	languages,
	Position,
	ProgressLocation,
	Range,
	TextDocument,
	TextDocumentChangeEvent,
	Uri,
	ViewColumn,
	window,
	workspace,
	WorkspaceEdit
} from 'vscode';
import {
	WorkspaceEdit as LSWorkspaceEdit
} from 'vscode-languageclient';
import {
	LanguageClient,
	RequestType,
	TextDocumentPositionParams,
	ServerOptions,
	TransportKind,
} from 'vscode-languageclient/node';
import { LanguageClientOptions, TextDocumentEdit } from 'vscode-languageclient';
import { activateTagClosing } from './html/autoClose.js';

const TagCloseRequest: RequestType<TextDocumentPositionParams, string, any> = new RequestType('html/tag');

let client: LanguageClient;

export async function activate(context: ExtensionContext) {
	const serverModule = require.resolve('@astrojs/language-server/bin/nodeServer.js');

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
			fileEvents: workspace.createFileSystemWatcher('{**/*.js,**/*.ts}', false, false, false),
		},
		initializationOptions: {
			environment: 'node',
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

	// Restart the language server if any critical files that are outside our jurisdiction got changed (tsconfig, jsconfig etc)
	workspace.onDidSaveTextDocument(async (doc: TextDocument) => {
		const fileName = doc.fileName.split(/\/|\\/).pop() ?? doc.fileName;
		if (
			[/^tsconfig\.json$/, /^jsconfig\.json$/, /^astro\.config\.(js|cjs|mjs|ts)$/].some((regex) => regex.test(fileName))
		) {
			await restartClient(false);
		}
	});

	workspace.onDidChangeTextDocument((params: TextDocumentChangeEvent) => {
		if (
			['vue', 'astro', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(
				params.document.languageId
			)
		) {
			getLSClient().sendNotification('$/onDidChangeNonAstroFile', {
				uri: params.document.uri.toString(true),
				// We only support partial changes for JS/TS files
				changes: ['vue', 'astro'].includes(params.document.languageId)
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
		await client.start();

		if (showNotification) {
			window.showInformationMessage('Astro language server restarted.');
		}

		restartingClient = false;
	}

	function getLSClient() {
		return client;
	}

	addDidChangeTextDocumentListener(getLSClient);
	addRenameFileListener(getLSClient);

	return {
		getLanguageServer: getLSClient,
	};
}

function addDidChangeTextDocumentListener(getLSClient: () => LanguageClient) {
	// Only Astro file changes are automatically notified through the inbuilt LSP
	// because the extension says it's only responsible for Astro files.
	// Therefore we need to set this up for TS/JS files manually.
	workspace.onDidChangeTextDocument((evt) => {
		if (evt.document.languageId === 'typescript' || evt.document.languageId === 'javascript') {
			getLSClient().sendNotification('$/onDidChangeNonAstroFile', {
				uri: evt.document.uri.toString(true),
				changes: evt.contentChanges.map((c) => ({
					range: {
						start: { line: c.range.start.line, character: c.range.start.character },
						end: { line: c.range.end.line, character: c.range.end.character }
					},
					text: c.text
				}))
			});
		}
	});
}

function addRenameFileListener(getLSClient: () => LanguageClient) {
	workspace.onDidRenameFiles(async (evt) => {
		const oldUri = evt.files[0].oldUri.toString(true);
		const parts = oldUri.split(/\/|\\/);
		const lastPart = parts[parts.length - 1];
		// If user moves/renames a folder, the URI only contains the parts up to that folder,
		// and not files. So in case the URI does not contain a '.', check for imports to update.
		if (
			lastPart.includes('.') &&
			!['.ts', '.js', '.json', '.astro'].some((ending) => lastPart.endsWith(ending))
		) {
			return;
		}

		window.withProgress(
			{ location: ProgressLocation.Window, title: 'Updating Imports..' },
			async () => {
				const editsForFileRename = await getLSClient().sendRequest<LSWorkspaceEdit | null>(
					'$/getEditsForFileRename',
					// Right now files is always an array with a single entry.
					// The signature was only designed that way to - maybe, in the future -
					// have the possibility to change that. If that ever does, update this.
					// In the meantime, just assume it's a single entry and simplify the
					// rest of the logic that way.
					{
						oldUri,
						newUri: evt.files[0].newUri.toString(true)
					}
				);
				const edits = editsForFileRename?.documentChanges?.filter(TextDocumentEdit.is);
				if (!edits) {
					return;
				}

				const workspaceEdit = new WorkspaceEdit();
				// We need to take into account multiple cases:
				// - A Astro file is moved/renamed
				//      -> all updates will be related to that Astro file, do that here. The TS LS won't even notice the update
				// - A TS/JS file is moved/renamed
				//      -> all updates will be related to that TS/JS file
				//      -> let the TS LS take care of these updates in TS/JS files, do Astro file updates here
				// - A folder with TS/JS AND Astro files is moved/renamed
				//      -> all Astro file updates are handled here
				//      -> all TS/JS file updates that consist of only TS/JS import updates are handled by the TS LS
				//      -> all TS/JS file updates that consist of only Astro import updates are handled here
				//      -> all TS/JS file updates that are mixed are handled here, but also possibly by the TS LS
				//         if the TS plugin doesn't prevent it. This trades risk of broken updates with certainty of missed updates
				edits.forEach((change) => {
					const isTsOrJsFile =
						change.textDocument.uri.endsWith('.ts') ||
						change.textDocument.uri.endsWith('.js') ||
						change.textDocument.uri.endsWith('.tsx') ||
						change.textDocument.uri.endsWith('.jsx');
					const containsAstroImportUpdate = change.edits.some((edit) =>
						edit.newText.endsWith('.astro')
					);
					if (isTsOrJsFile && !containsAstroImportUpdate) {
						return;
					}

					change.edits.forEach((edit) => {
						if (
							isTsOrJsFile &&
							!edit.newText.endsWith('.astro')
							// && !TsPlugin.isEnabled()
						) {
							// TS plugin enabled -> all mixed imports are handled here
							// TS plugin disabled -> let TS/JS path updates be handled by the TS LS, Astro here
							return;
						}

						// Renaming a file should only result in edits of existing files
						workspaceEdit.replace(
							Uri.parse(change.textDocument.uri),
							new Range(
								new Position(edit.range.start.line, edit.range.start.character),
								new Position(edit.range.end.line, edit.range.end.character)
							),
							edit.newText
						);
					});
				});
				workspace.applyEdit(workspaceEdit);
			}
		);
	});
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
