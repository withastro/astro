import {
	commands,
	ConfigurationChangeEvent,
	ExtensionContext,
	TextDocument,
	TextDocumentChangeEvent,
	ViewColumn,
	window,
	workspace,
} from 'vscode';
import { BaseLanguageClient, LanguageClientOptions } from 'vscode-languageclient';
import * as fileReferences from './features/fileReferences';

// Files we want to watch for file updates, this only includes files where we actually care
// about the content, so HTML components and Markdown files are not included
const supportedFileExtensions = [
	'astro',
	'cjs',
	'mjs',
	'js',
	'jsx',
	'cts',
	'mts',
	'ts',
	'tsx',
	'json',
	'vue',
	'svelte',
] as const;

export function getInitOptions(env: 'node' | 'browser', typescript: any): LanguageClientOptions {
	return {
		documentSelector: [{ scheme: 'file', language: 'astro' }],
		synchronize: {
			fileEvents: workspace.createFileSystemWatcher(
				`{${supportedFileExtensions.map((ext) => `**/*.${ext}`).join(',')}}`,
				false,
				false,
				false
			),
		},
		initializationOptions: {
			typescript,
			environment: env,
			dontFilterIncompleteCompletions: true, // VSCode filters client side and is smarter at it than us
			isTrusted: workspace.isTrusted,
		},
	};
}

export function commonActivate(context: ExtensionContext, client: BaseLanguageClient, tsVersion: any) {
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

	// Handle unsaved changes for non-Astro files like TypeScript does
	workspace.onDidChangeTextDocument((params: TextDocumentChangeEvent) => {
		if (
			supportedFileExtensions.filter((ext) => ext !== 'astro').some((ext) => params.document.fileName.endsWith(ext))
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

			// Partial updates are only supported for files TypeScript natively understand. For svelte and vue files, we'll
			// instead send the full text and recreate a snapshot server-side with the new content
			const supportPartialUpdate = !['vue', 'svelte'].includes(params.document.languageId);
			getLSClient().sendNotification('$/onDidChangeNonAstroFile', {
				uri: params.document.uri.toString(true),
				...(supportPartialUpdate
					? {
							changes: params.contentChanges.map((c) => ({
								range: {
									start: { line: c.range.start.line, character: c.range.start.character },
									end: { line: c.range.end.line, character: c.range.end.character },
								},
								text: c.text,
							})),
					  }
					: { text: params.document.getText() }),
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
		commands.registerCommand('astro.selectTypescriptVersion', () => tsVersion.selectVersionCommand(context, client)),
		commands.registerCommand('astro.findFileReferences', () =>
			fileReferences.findFileReferences(window.activeTextEditor?.document.uri, getLSClient())
		)
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
}
