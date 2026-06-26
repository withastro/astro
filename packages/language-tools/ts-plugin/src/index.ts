import * as path from 'node:path';
import type { LanguagePlugin } from '@volar/language-core';
import { createLanguageServicePlugin } from '@volar/typescript/lib/quickstart/createLanguageServicePlugin.js';
import type { CollectionConfig } from './frontmatter.js';
import { getFrontmatterLanguagePlugin } from './frontmatter.js';
import { getLanguagePlugin } from './language.js';

const decoratedHosts = new WeakSet<import('typescript').LanguageServiceHost>();

function findAstroDirectory(currentDir: string): string | undefined {
	try {
		const packageJSON = require.resolve('astro/package.json', { paths: [currentDir] });
		return path.dirname(packageJSON);
	} catch {
		return undefined;
	}
}

function addAstroTypes(
	ts: typeof import('typescript'),
	host: import('typescript').LanguageServiceHost,
	astroDirectory: string,
) {
	if (decoratedHosts.has(host)) {
		return;
	}
	decoratedHosts.add(host);

	const getScriptFileNames = host.getScriptFileNames.bind(host);

	host.getScriptFileNames = () => {
		const fileNames = getScriptFileNames();
		const addedFileNames = ['./env.d.ts', './astro-jsx.d.ts'].map((filePath) =>
			ts.sys.resolvePath(path.resolve(astroDirectory, filePath)),
		);
		return [...fileNames, ...addedFileNames];
	};
}

export = createLanguageServicePlugin((ts, info) => {
	const currentDir = info.project.getCurrentDirectory();

	let collectionConfig = undefined;

	try {
		const fileContent = ts.sys.readFile(currentDir + '/.astro/collections/collections.json');
		if (fileContent) {
			collectionConfig = {
				folder: currentDir,
				config: JSON.parse(fileContent) as CollectionConfig['config'],
			};
		}
	} catch (err) {
		// If the file doesn't exist, we don't really care, but if it's something else, we want to know
		if (err && (err as any).code !== 'ENOENT') console.error(err);
	}

	const astroDirectory = findAstroDirectory(currentDir);
	if (astroDirectory) {
		addAstroTypes(ts, info.languageServiceHost, astroDirectory);
	}

	let languagePlugins: LanguagePlugin<string>[] = [getLanguagePlugin()];

	if (collectionConfig) {
		languagePlugins.push(getFrontmatterLanguagePlugin([collectionConfig]));
	}

	return {
		languagePlugins,
	};
});
