import * as path from 'path';
import { ExtensionContext, Memento, Position, TextDocument, Uri, window, workspace } from 'vscode';
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

	let lsPath = await getConfiguredServerPath(context.workspaceState);
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

async function getConfiguredServerPath(workspaceState: Memento) {
	const scope = 'astro.language-server';
	const detailedLSPath = workspace.getConfiguration(scope).inspect<string>('ls-path');

	const lsPath = detailedLSPath?.globalLanguageValue
		|| detailedLSPath?.defaultLanguageValue
		|| detailedLSPath?.globalValue
		|| detailedLSPath?.defaultValue;

	const workspaceLSPath = detailedLSPath?.workspaceFolderLanguageValue
		|| detailedLSPath?.workspaceLanguageValue
		|| detailedLSPath?.workspaceFolderValue
		|| detailedLSPath?.workspaceValue;

	const useLocalLanguageServerKey = `${scope}.useLocalLS`;
	let useWorkspaceServer = workspaceState.get<boolean>(useLocalLanguageServerKey);

	if (useWorkspaceServer === undefined && workspaceLSPath !== undefined) {
		const msg = 'This workspace contains an Astro Language Server version. Would you like to use the workplace version?';
		const allowPrompt = 'Allow';
		const dismissPrompt = 'Dismiss';
		const neverPrompt = 'Never in This Workspace';

		const result = await window.showInformationMessage(msg, allowPrompt, dismissPrompt, neverPrompt);

		if (result === allowPrompt) {
			await workspaceState.update(useLocalLanguageServerKey, true);
			useWorkspaceServer = true;
		}
		else if (result === neverPrompt) {
			await workspaceState.update(useLocalLanguageServerKey, false);
		}
	}

	if (useWorkspaceServer === true) {
		return workspaceLSPath || lsPath;
	}
	else {
		return lsPath;
	}
}
