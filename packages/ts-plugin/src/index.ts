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
