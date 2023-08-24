import { createVirtualFiles } from '@volar/language-core';
import {
	decorateLanguageService,
	decorateLanguageServiceHost,
	getExternalFiles,
} from '@volar/typescript';
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

			// HACK: AutoImportProviderProject's script kind does not match the one of the language service host here
			// this causes TypeScript to throw and crash. So, we'll fake being a TS file here for now until they fix it
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

			return info.languageService;
		},
		getExternalFiles(project) {
			if (!externalFiles.has(project)) {
				externalFiles.set(project, getExternalFiles(ts, project, ['.astro']));
			}
			return externalFiles.get(project)!;
		},
	};
	return pluginModule;
};

export = init;
