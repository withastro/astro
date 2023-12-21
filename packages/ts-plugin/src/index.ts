import { createVirtualFiles } from '@volar/language-core';
import {
	decorateLanguageService,
	decorateLanguageServiceHost,
	searchExternalFiles,
} from '@volar/typescript';
import * as semver from 'semver';
import type ts from 'typescript/lib/tsserverlibrary';
import { getLanguageModule } from './language.js';

const externalFiles = new WeakMap<ts.server.Project, string[]>();

const init: ts.server.PluginModuleFactory = (modules) => {
	const { typescript: ts } = modules;
	const pluginModule: ts.server.PluginModule = {
		create(info) {
			const virtualFiles = createVirtualFiles([getLanguageModule(ts)]);

			decorateLanguageService(virtualFiles, info.languageService, true);
			decorateLanguageServiceHost(virtualFiles, info.languageServiceHost, ts, ['.astro']);

			if (semver.lt(ts.version, '5.3.0')) {
				// HACK: AutoImportProviderProject's script kind does not match the one of the language service host here
				// this causes TypeScript to throw and crash. So, we'll fake being a TS file here for now until they fix it
				// Fixed by https://github.com/microsoft/TypeScript/pull/55716
				const getScriptKind = info.languageServiceHost.getScriptKind?.bind(
					info.languageServiceHost.getScriptKind
				);
				if (getScriptKind) {
					info.languageServiceHost.getScriptKind = (fileName) => {
						if (fileName.endsWith('.astro')) {
							return ts.ScriptKind.TS;
						}
						return getScriptKind(fileName);
					};
				}
			}

			return info.languageService;
		},
		getExternalFiles(project, updateLevel = 0) {
			if (
				// @ts-expect-error wait for TS 5.3
				updateLevel >= (1 satisfies ts.ProgramUpdateLevel.RootNamesAndUpdate) ||
				!externalFiles.has(project)
			) {
				const oldFiles = externalFiles.get(project);
				const newFiles = searchExternalFiles(ts, project, ['.astro']);
				externalFiles.set(project, newFiles);
				if (oldFiles && !arrayItemsEqual(oldFiles, newFiles)) {
					project.refreshDiagnostics();
				}
			}
			return externalFiles.get(project)!;
		},
	};
	return pluginModule;
};

function arrayItemsEqual(a: string[], b: string[]) {
	if (a.length !== b.length) {
		return false;
	}
	const set = new Set(a);
	for (const file of b) {
		if (!set.has(file)) {
			return false;
		}
	}
	return true;
}

export = init;
