import * as vscode from 'vscode-languageserver';
import {
	CodeActionKind,
	DidChangeConfigurationNotification,
	DocumentUri,
	InlayHintRequest,
	LinkedEditingRangeRequest,
	MessageType,
	SemanticTokensRangeRequest,
	SemanticTokensRequest,
	ShowMessageNotification,
	TextDocumentIdentifier,
} from 'vscode-languageserver';
import { ConfigManager, defaultLSConfig } from './core/config/ConfigManager';
import { DocumentManager } from './core/documents/DocumentManager';
import { DiagnosticsManager } from './core/DiagnosticsManager';
import { AstroPlugin } from './plugins/astro/AstroPlugin';
import { CSSPlugin } from './plugins/css/CSSPlugin';
import { HTMLPlugin } from './plugins/html/HTMLPlugin';
import type { AppCompletionItem } from './plugins/interfaces';
import { PluginHost } from './plugins/PluginHost';
import { TypeScriptPlugin } from './plugins';
import { debounceThrottle, getAstroInstall, isAstroWorkspace, normalizeUri, urlToPath } from './utils';
import type { AstroDocument } from './core/documents';
import { getSemanticTokenLegend } from './plugins/typescript/utils';
import { sortImportKind } from './plugins/typescript/features/CodeActionsProvider';
import type { LSConfig } from './core/config';
import { LanguageServiceManager } from './plugins/typescript/LanguageServiceManager';

const TagCloseRequest: vscode.RequestType<vscode.TextDocumentPositionParams, string | null, any> =
	new vscode.RequestType('html/tag');

export interface RuntimeEnvironment {
	loadTypescript: (initOptions: any) => typeof import('typescript/lib/tsserverlibrary');
	loadTypescriptLocalized: (initOptions: any) => Record<string, string> | undefined;
}

// Start the language server
export function startLanguageServer(connection: vscode.Connection, env: RuntimeEnvironment) {
	// Create our managers
	const documentManager = new DocumentManager();
	const pluginHost = new PluginHost(documentManager);
	const configManager = new ConfigManager(connection);

	let typescriptPlugin: TypeScriptPlugin = undefined as any;
	let hasConfigurationCapability = false;

	connection.onInitialize((params: vscode.InitializeParams) => {
		const environment: 'node' | 'browser' = params.initializationOptions?.environment ?? 'node';
		const workspaceUris = params.workspaceFolders?.map((folder) => folder.uri.toString()) ?? [params.rootUri ?? ''];

		workspaceUris.forEach((uri) => {
			uri = urlToPath(uri) as string;

			// If the workspace is not an Astro project, we shouldn't warn about not finding Astro
			// Unless the extension enabled itself in an untitled workspace, in which case the warning is valid
			if (!isAstroWorkspace(uri) && uri !== '/' && uri !== '') {
				return;
			}

			const astroInstall = getAstroInstall([uri]);
			if (!astroInstall) {
				connection.sendNotification(ShowMessageNotification.type, {
					message: `Couldn't find Astro in workspace "${uri}". Experience might be degraded. For the best experience, please make sure Astro is installed and then restart the language server`,
					type: MessageType.Warning,
				});
			}
		});

		hasConfigurationCapability = !!(params.capabilities.workspace && !!params.capabilities.workspace.configuration);

		pluginHost.initialize({
			filterIncompleteCompletions: !params.initializationOptions?.dontFilterIncompleteCompletions,
			definitionLinkSupport: !!params.capabilities.textDocument?.definition?.linkSupport,
		});

		// Register plugins
		pluginHost.registerPlugin(new HTMLPlugin(configManager));
		pluginHost.registerPlugin(new CSSPlugin(configManager));

		// We don't currently support running the TypeScript and Astro plugin in the browser
		if (environment === 'node') {
			const ts = env.loadTypescript(params.initializationOptions);

			if (ts) {
				const tsLocalized = env.loadTypescriptLocalized(params.initializationOptions);
				const languageServiceManager = new LanguageServiceManager(
					documentManager,
					workspaceUris.map(normalizeUri),
					configManager,
					ts,
					tsLocalized
				);

				typescriptPlugin = new TypeScriptPlugin(configManager, languageServiceManager);
				pluginHost.registerPlugin(new AstroPlugin(configManager, languageServiceManager));
				pluginHost.registerPlugin(typescriptPlugin);
			} else {
				connection.sendNotification(ShowMessageNotification.type, {
					message: `Astro: Couldn't load TypeScript from path ${params?.initializationOptions?.typescript?.serverPath}. Only HTML and CSS features will be enabled`,
					type: MessageType.Warning,
				});
			}
		}

		return {
			capabilities: {
				textDocumentSync: {
					openClose: true,
					change: vscode.TextDocumentSyncKind.Incremental,
					save: {
						includeText: true,
					},
				},
				foldingRangeProvider: true,
				definitionProvider: true,
				typeDefinitionProvider: true,
				renameProvider: true,
				documentFormattingProvider: true,
				codeActionProvider: {
					codeActionKinds: [
						CodeActionKind.QuickFix,
						CodeActionKind.SourceOrganizeImports,
						// VS Code specific
						sortImportKind,
					],
				},
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
				colorProvider: true,
				hoverProvider: true,
				documentSymbolProvider: true,
				linkedEditingRangeProvider: true,
				semanticTokensProvider: {
					legend: getSemanticTokenLegend(),
					range: true,
					full: true,
				},
				inlayHintProvider: true,
				signatureHelpProvider: {
					triggerCharacters: ['(', ',', '<'],
					retriggerCharacters: [')'],
				},
			},
		};
	});

	// The params don't matter here because in "pull mode" it's always null, it's intended that when the config is updated
	// you should just reset "your internal cache" and get the config again for relevant documents, weird API design
	connection.onDidChangeConfiguration(async (change) => {
		if (hasConfigurationCapability) {
			configManager.updateConfig();

			documentManager.getAllOpenedByClient().forEach(async (document) => {
				await configManager.getConfig('astro', document[1].uri);
			});
		} else {
			configManager.updateGlobalConfig(<LSConfig>change.settings.astro || defaultLSConfig);
		}

		updateAllDiagnostics();
	});

	// Documents
	connection.onDidOpenTextDocument((params: vscode.DidOpenTextDocumentParams) => {
		documentManager.openDocument(params.textDocument);
		documentManager.markAsOpenedInClient(params.textDocument.uri);
	});
	connection.onDidCloseTextDocument((params: vscode.DidCloseTextDocumentParams) =>
		documentManager.closeDocument(params.textDocument.uri)
	);
	connection.onDidChangeTextDocument((params: vscode.DidChangeTextDocumentParams) => {
		documentManager.updateDocument(params.textDocument, params.contentChanges);
	});

	const diagnosticsManager = new DiagnosticsManager(
		connection.sendDiagnostics,
		documentManager,
		pluginHost.getDiagnostics.bind(pluginHost)
	);

	const updateAllDiagnostics = debounceThrottle(() => diagnosticsManager.updateAll(), 1000);

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

	// Features
	connection.onHover((params: vscode.HoverParams) => pluginHost.doHover(params.textDocument, params.position));

	connection.onDefinition((evt) => pluginHost.getDefinitions(evt.textDocument, evt.position));

	connection.onTypeDefinition((evt) => pluginHost.getTypeDefinition(evt.textDocument, evt.position));

	connection.onFoldingRanges((evt) => pluginHost.getFoldingRanges(evt.textDocument));

	connection.onCodeAction((evt, cancellationToken) =>
		pluginHost.getCodeActions(evt.textDocument, evt.range, evt.context, cancellationToken)
	);

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

	connection.onDocumentSymbol((params: vscode.DocumentSymbolParams, cancellationToken) =>
		pluginHost.getDocumentSymbols(params.textDocument, cancellationToken)
	);

	connection.onRequest(SemanticTokensRequest.type, (evt, cancellationToken) =>
		pluginHost.getSemanticTokens(evt.textDocument, undefined, cancellationToken)
	);
	connection.onRequest(SemanticTokensRangeRequest.type, (evt, cancellationToken) =>
		pluginHost.getSemanticTokens(evt.textDocument, evt.range, cancellationToken)
	);

	connection.onRequest(
		LinkedEditingRangeRequest.type,
		async (evt) => await pluginHost.getLinkedEditingRanges(evt.textDocument, evt.position)
	);

	connection.onDocumentFormatting((params: vscode.DocumentFormattingParams) =>
		pluginHost.formatDocument(params.textDocument, params.options)
	);

	connection.onDocumentColor((params: vscode.DocumentColorParams) => pluginHost.getDocumentColors(params.textDocument));
	connection.onColorPresentation((params: vscode.ColorPresentationParams) =>
		pluginHost.getColorPresentations(params.textDocument, params.range, params.color)
	);

	connection.onRequest(InlayHintRequest.type, (params: vscode.InlayHintParams, cancellationToken) =>
		pluginHost.getInlayHints(params.textDocument, params.range, cancellationToken)
	);

	connection.onRequest(TagCloseRequest, (evt: any) => pluginHost.doTagComplete(evt.textDocument, evt.position));
	connection.onSignatureHelp((evt, cancellationToken) =>
		pluginHost.getSignatureHelp(evt.textDocument, evt.position, evt.context, cancellationToken)
	);
	connection.onRenameRequest((evt) => pluginHost.rename(evt.textDocument, evt.position, evt.newName));

	connection.onDidSaveTextDocument(updateAllDiagnostics);
	connection.onNotification('$/onDidChangeNonAstroFile', async (e: any) => {
		const path = urlToPath(e.uri);
		if (path) {
			pluginHost.updateNonAstroFile(path, e.changes);
		}
		updateAllDiagnostics();
	});

	connection.onRequest('$/getTSXOutput', async (uri: DocumentUri) => {
		const doc = documentManager.get(uri);
		if (!doc) {
			return undefined;
		}

		if (doc) {
			const tsxOutput = typescriptPlugin.getTSXForDocument(doc);
			return tsxOutput.code;
		}
	});

	documentManager.on(
		'documentChange',
		debounceThrottle(async (document: AstroDocument) => diagnosticsManager.update(document), 1000)
	);

	documentManager.on('documentClose', (document: AstroDocument) => {
		diagnosticsManager.removeDiagnostics(document);
		configManager.removeDocument(document.uri);
	});

	// Taking off 🚀
	connection.onInitialized(() => {
		connection.console.log('Successfully initialized! 🚀');

		// Register for all configuration changes.
		if (hasConfigurationCapability) {
			connection.client.register(DidChangeConfigurationNotification.type);
		}
	});

	connection.listen();
}
