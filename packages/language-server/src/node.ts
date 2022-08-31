import * as vscode from 'vscode-languageserver/node';
import { startLanguageServer } from './server';

const connection = vscode.createConnection(vscode.ProposedFeatures.all);

startLanguageServer(connection, {
	loadTypescript(options) {
		if (options?.typescript?.serverPath) {
			return require(options?.typescript?.serverPath);
		}
	},
	loadTypescriptLocalized(options) {
		if (options?.typescript?.localizedPath) {
			try {
				return require(options?.typescript?.localizedPath);
			} catch {}
		}
	},
});
