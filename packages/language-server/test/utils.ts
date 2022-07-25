import { ConfigManager } from '../src/core/config';
import { AstroDocument, DocumentManager } from '../src/core/documents';
import ts from 'typescript';
import { join } from 'path';
import { pathToUrl } from '../src/utils';
import { FormattingOptions } from 'vscode-languageserver-types';

/**
 *
 * @param filePath path to the fixture to load
 * @param baseDir directory to find the fixture folder in (ex: typescript)
 * @param pathPrefix prefix to add to every paths (useful for fixtures that are in sub folders)
 * @returns
 */
export function createEnvironment(filePath: string, baseDir: string, pathPrefix?: string) {
	const fixtureDir = join(__dirname, 'plugins', baseDir, 'fixtures');

	const docManager = new DocumentManager((astroDocument) => new AstroDocument(astroDocument.uri, astroDocument.text));
	const configManager = new ConfigManager();
	const document = openDocument(filePath, join(fixtureDir, pathPrefix ?? ''), docManager);

	return { document, docManager, configManager, fixturesDir: pathToUrl(fixtureDir) };
}

export function openDocument(filePath: string, baseDir: string, docManager: DocumentManager) {
	const path = join(baseDir, filePath);

	if (!ts.sys.fileExists(path) || !path) {
		throw new Error(`File ${path} doesn't exist`);
	}

	const document = docManager.openDocument({
		uri: pathToUrl(path),
		text: harmonizeNewLines(ts.sys.readFile(path) || ''),
	});

	return document;
}

function harmonizeNewLines(input: string) {
	return input.replace(/\r\n/g, '~:~').replace(/\n/g, '~:~').replace(/~:~/g, '\n');
}

// Outside of the Astro and TypeScript plugins, we don't really need to create a real environnement with proper
// handling of files and stuff, having a document with just a content suffice
export function createFakeEnvironment(content: string) {
	const document = new AstroDocument('file:///hello.astro', content);
	const docManager = new DocumentManager(() => document);
	const configManager = new ConfigManager();
	docManager.openDocument(<any>'some doc');

	return { document, configManager };
}

export const defaultFormattingOptions: FormattingOptions = {
	tabSize: 2,
	indentSize: 2,
	insertSpaces: true,
};
