// Adapted from https://github.com/johnsoncodehk/volar/blob/75c48dbd525542ae8db4f28312552f08c7bcdfef/packages/shared/src/ts_node.ts
// and https://github.com/johnsoncodehk/volar/blob/ef33bacf2f16ecb4a238e81803b931bf830ea18f/extensions/vscode-vue-language-features/src/features/tsVersion.ts

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import type { BaseLanguageClient } from 'vscode-languageclient';

const defaultTsdk = 'node_modules/typescript/lib';

export async function selectVersionCommand(context: vscode.ExtensionContext, client: BaseLanguageClient) {
	const useWorkspaceTsdk = getCurrentTsPaths(context).isWorkspacePath;
	const workspaceTsPaths = getWorkspaceTsPaths();
	const workspaceTsVersion = workspaceTsPaths ? getTypeScriptVersion(workspaceTsPaths.serverPath) : undefined;
	const vscodeTsPaths = getVscodeTsPaths();
	const vscodeTsVersion = getTypeScriptVersion(vscodeTsPaths.serverPath);
	const tsdk = getTsdk();
	const defaultTsServer = getWorkspaceTypescriptPath(
		defaultTsdk,
		(vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri.fsPath)
	);
	const defaultTsVersion = defaultTsServer ? getTypeScriptVersion(defaultTsServer) : undefined;

	const options: Record<string, vscode.QuickPickItem> = {};
	options[0] = {
		label: (!useWorkspaceTsdk ? '• ' : '') + "Use VS Code's Version",
		description: vscodeTsVersion,
	};
	if (tsdk) {
		options[1] = {
			label: (useWorkspaceTsdk ? '• ' : '') + 'Use Workspace Version',
			description: workspaceTsVersion ?? 'Could not load the TypeScript version at this path',
			detail: tsdk,
		};
	}
	if (tsdk !== defaultTsdk) {
		options[2] = {
			label: (useWorkspaceTsdk ? '• ' : '') + 'Use Workspace Version',
			description: defaultTsVersion ?? 'Could not load the TypeScript version at this path',
			detail: defaultTsdk,
		};
	}

	const select = await userPick(options);
	if (select === undefined) return; // cancel

	if (select === '2') {
		vscode.workspace.getConfiguration('typescript').update('tsdk', defaultTsdk);
	}

	const nowUseWorkspaceTsdk = select !== '0';
	if (nowUseWorkspaceTsdk !== isUseWorkspaceTsdk(context)) {
		context.workspaceState.update('typescript.useWorkspaceTsdk', nowUseWorkspaceTsdk);
		restartServer(context, client);
	}
}

export async function onDidChangeConfiguration(
	event: vscode.ConfigurationChangeEvent,
	context: vscode.ExtensionContext,
	client: BaseLanguageClient
) {
	if (event.affectsConfiguration('typescript.tsdk') || event.affectsConfiguration('typescript.locale')) {
		restartServer(context, client);
	}
}

async function restartServer(context: vscode.ExtensionContext, client: BaseLanguageClient) {
	const tsPaths = getCurrentTsPaths(context);
	const newInitOptions = {
		...client.clientOptions.initializationOptions,
		typescript: tsPaths,
	};

	client.clientOptions.initializationOptions = newInitOptions;
	vscode.commands.executeCommand('astro.restartLanguageServer', false);
}

export function getCurrentTsPaths(context: vscode.ExtensionContext) {
	if (isUseWorkspaceTsdk(context)) {
		const workspaceTsPaths = getWorkspaceTsPaths(true);
		if (workspaceTsPaths) {
			return { ...workspaceTsPaths, isWorkspacePath: true };
		}
	}
	return { ...getVscodeTsPaths(), isWorkspacePath: false };
}

function userPick(
	groups: Record<string, vscode.QuickPickItem> | Record<string, vscode.QuickPickItem>[],
	placeholder?: string
) {
	return new Promise<string | undefined>((resolve) => {
		const quickPick = vscode.window.createQuickPick();
		const items: vscode.QuickPickItem[] = [];
		for (const group of Array.isArray(groups) ? groups : [groups]) {
			const groupItems = Object.values(group);
			if (groupItems.length) {
				if (items.length) {
					items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });
				}
				for (const item of groupItems) {
					items.push(item);
				}
			}
		}
		quickPick.items = items;
		quickPick.placeholder = placeholder;
		quickPick.onDidChangeSelection((selection) => {
			if (selection[0]) {
				for (const options of Array.isArray(groups) ? groups : [groups]) {
					for (let key in options) {
						const option = options[key];
						if (selection[0] === option) {
							resolve(key);
							quickPick.hide();
							break;
						}
					}
				}
			}
		});
		quickPick.onDidHide(() => {
			quickPick.dispose();
			resolve(undefined);
		});
		quickPick.show();
	});
}

function getTypeScriptVersion(serverPath: string): string | undefined {
	if (!fs.existsSync(serverPath)) {
		return undefined;
	}

	const p = serverPath.split(path.sep);
	if (p.length <= 2) {
		return undefined;
	}
	const p2 = p.slice(0, -2);
	const modulePath = p2.join(path.sep);
	let fileName = path.join(modulePath, 'package.json');
	if (!fs.existsSync(fileName)) {
		// Special case for ts dev versions
		if (path.basename(modulePath) === 'built') {
			fileName = path.join(modulePath, '..', 'package.json');
		}
	}
	if (!fs.existsSync(fileName)) {
		return undefined;
	}

	const contents = fs.readFileSync(fileName).toString();
	let desc: any = null;
	try {
		desc = JSON.parse(contents);
	} catch (err) {
		return undefined;
	}
	if (!desc || !desc.version) {
		return undefined;
	}
	return desc.version;
}

function getWorkspaceTypescriptPath(tsdk: string, workspaceFolderFsPaths: string[]) {
	if (path.isAbsolute(tsdk)) {
		const tsPath = findTypescriptModulePathInLib(tsdk);
		if (tsPath) {
			return tsPath;
		}
	} else {
		for (const folder of workspaceFolderFsPaths) {
			const tsPath = findTypescriptModulePathInLib(path.join(folder, tsdk));
			if (tsPath) {
				return tsPath;
			}
		}
	}
}

function getWorkspaceTypescriptLocalizedPath(tsdk: string, lang: string, workspaceFolderFsPaths: string[]) {
	if (path.isAbsolute(tsdk)) {
		const tsPath = findTypescriptLocalizedPathInLib(tsdk, lang);
		if (tsPath) {
			return tsPath;
		}
	} else {
		for (const folder of workspaceFolderFsPaths) {
			const tsPath = findTypescriptLocalizedPathInLib(path.join(folder, tsdk), lang);
			if (tsPath) {
				return tsPath;
			}
		}
	}
}

function findTypescriptModulePathInLib(lib: string) {
	const tsserverlibrary = path.join(lib, 'tsserverlibrary.js');
	const typescript = path.join(lib, 'typescript.js');
	const tsserver = path.join(lib, 'tsserver.js');

	if (fs.existsSync(tsserverlibrary)) {
		return tsserverlibrary;
	}
	if (fs.existsSync(typescript)) {
		return typescript;
	}
	if (fs.existsSync(tsserver)) {
		return tsserver;
	}
}

function findTypescriptLocalizedPathInLib(lib: string, lang: string) {
	const localized = path.join(lib, lang, 'diagnosticMessages.generated.json');

	if (fs.existsSync(localized)) {
		return localized;
	}
}

function getVscodeTypescriptPath(appRoot: string) {
	return path.join(appRoot, 'extensions', 'node_modules', 'typescript', 'lib', 'typescript.js');
}

function getVscodeTypescriptLocalizedPath(appRoot: string, lang: string): string | undefined {
	const tsPath = path.join(
		appRoot,
		'extensions',
		'node_modules',
		'typescript',
		'lib',
		lang,
		'diagnosticMessages.generated.json'
	);

	if (fs.existsSync(tsPath)) {
		return tsPath;
	}
}

function getWorkspaceTsPaths(useDefault = false) {
	let tsdk = getTsdk();
	if (!tsdk && useDefault) {
		tsdk = defaultTsdk;
	}
	if (tsdk) {
		const fsPaths = (vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri.fsPath);
		const tsPath = getWorkspaceTypescriptPath(tsdk, fsPaths);
		if (tsPath) {
			return {
				serverPath: tsPath,
				localizedPath: getWorkspaceTypescriptLocalizedPath(tsdk, getLocale(), fsPaths),
			};
		}
	}
}

function getVscodeTsPaths() {
	const nightly = vscode.extensions.getExtension('ms-vscode.vscode-typescript-next');
	if (nightly) {
		const tsLibPath = path.join(nightly.extensionPath, 'node_modules/typescript/lib');
		const serverPath = findTypescriptModulePathInLib(tsLibPath);
		if (serverPath) {
			return {
				serverPath,
				localizedPath: findTypescriptLocalizedPathInLib(tsLibPath, getLocale()),
			};
		}
	}
	return {
		serverPath: getVscodeTypescriptPath(vscode.env.appRoot),
		localizedPath: getVscodeTypescriptLocalizedPath(vscode.env.appRoot, getLocale()),
	};
}

function getTsdk() {
	const tsConfig = vscode.workspace.getConfiguration('typescript');
	const tsdk = tsConfig.get<string>('tsdk');
	return tsdk;
}

function getLocale() {
	const tsConfig = vscode.workspace.getConfiguration('typescript');
	const locale = tsConfig.get<string>('locale');

	if (locale === undefined || locale === 'auto') {
		return vscode.env.language;
	}

	return locale;
}

function isUseWorkspaceTsdk(context: vscode.ExtensionContext) {
	return context.workspaceState.get('typescript.useWorkspaceTsdk', false);
}
