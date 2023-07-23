import { DiagnosticModel, InitializationOptions } from '@volar/language-server';
import * as protocol from '@volar/language-server/protocol';
import {
	activateAutoInsertion,
	activateFindFileReferences,
	activateReloadProjects,
	activateTsConfigStatusItem,
	activateTsVersionStatusItem,
	getTsdk,
	supportLabsVersion,
	type ExportsInfoForLabs,
} from '@volar/vscode';
import * as path from 'node:path';
import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient/node';

let client: lsp.BaseLanguageClient;

export async function activate(context: vscode.ExtensionContext): Promise<ExportsInfoForLabs> {
	const runtimeConfig = vscode.workspace.getConfiguration('astro.language-server');

	const { workspaceFolders } = vscode.workspace;
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
		: vscode.Uri.joinPath(context.extensionUri, 'dist/node/server.js').fsPath;

	const runOptions = { execArgv: [] };
	const debugOptions = { execArgv: ['--nolazy', '--inspect=' + 6009] };

	const serverOptions: lsp.ServerOptions = {
		run: {
			module: serverModule,
			transport: lsp.TransportKind.ipc,
			options: runOptions,
		},
		debug: {
			module: serverModule,
			transport: lsp.TransportKind.ipc,
			options: debugOptions,
		},
	};

	const serverRuntime = runtimeConfig.get<string>('runtime');
	if (serverRuntime) {
		serverOptions.run.runtime = serverRuntime;
		serverOptions.debug.runtime = serverRuntime;
		console.info(`Using ${serverRuntime} as runtime`);
	}

	const initializationOptions: InitializationOptions = {
		typescript: {
			tsdk: (await getTsdk(context)).tsdk,
		},
		diagnosticModel: DiagnosticModel.Push,
	};
	const clientOptions: lsp.LanguageClientOptions = {
		documentSelector: [{ language: 'astro' }],
		initializationOptions,
	};
	client = new lsp.LanguageClient('astro', 'Astro Language Server', serverOptions, clientOptions);
	await client.start();

	// support for auto close tag
	activateAutoInsertion([client], (document) => document.languageId === 'astro');
	activateFindFileReferences('astro.findFileReferences', client);
	activateReloadProjects('astro.reloadProjects', [client]);
	activateTsConfigStatusItem('astro.openTsConfig', client, () => false);
	activateTsVersionStatusItem(
		'astro.selectTypescriptVersion',
		context,
		client,
		(document) => document.languageId === 'astro',
		(text) => text,
		true
	);

	return {
		volarLabs: {
			version: supportLabsVersion,
			languageClients: [client],
			languageServerProtocol: protocol,
		},
	};
}

export function deactivate(): Thenable<any> | undefined {
	return client?.stop();
}

async function getConfiguredServerPath(workspaceState: vscode.Memento) {
	const scope = 'astro.language-server';
	const detailedLSPath = vscode.workspace.getConfiguration(scope).inspect<string>('ls-path');

	const lsPath =
		detailedLSPath?.globalLanguageValue ||
		detailedLSPath?.defaultLanguageValue ||
		detailedLSPath?.globalValue ||
		detailedLSPath?.defaultValue;

	const workspaceLSPath =
		detailedLSPath?.workspaceFolderLanguageValue ||
		detailedLSPath?.workspaceLanguageValue ||
		detailedLSPath?.workspaceFolderValue ||
		detailedLSPath?.workspaceValue;

	const useLocalLanguageServerKey = `${scope}.useLocalLS`;
	let useWorkspaceServer = workspaceState.get<boolean>(useLocalLanguageServerKey);

	if (useWorkspaceServer === undefined && workspaceLSPath !== undefined) {
		const msg =
			'This workspace contains an Astro Language Server version. Would you like to use the workplace version?';
		const allowPrompt = 'Allow';
		const dismissPrompt = 'Dismiss';
		const neverPrompt = 'Never in This Workspace';

		const result = await vscode.window.showInformationMessage(
			msg,
			allowPrompt,
			dismissPrompt,
			neverPrompt
		);

		if (result === allowPrompt) {
			await workspaceState.update(useLocalLanguageServerKey, true);
			useWorkspaceServer = true;
		} else if (result === neverPrompt) {
			await workspaceState.update(useLocalLanguageServerKey, false);
		}
	}

	if (useWorkspaceServer === true) {
		return workspaceLSPath || lsPath;
	} else {
		return lsPath;
	}
}
