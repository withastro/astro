import path from 'node:path';
import type { LanguagePlugin } from '@volar/language-core';
import { createLanguageServicePlugin } from '@volar/typescript/lib/quickstart/createLanguageServicePlugin.js';
import { addAstroTypes } from './astro-types.js';
import type { CollectionConfig } from './frontmatter.js';
import { getFrontmatterLanguagePlugin } from './frontmatter.js';
import { getLanguagePlugin } from './language.js';

export = createLanguageServicePlugin((ts, info) => {
	let collectionConfig = undefined;
	const currentDir = info.project.getCurrentDirectory();

	// Make "Go To References" from `.ts` files aware of usages inside `.astro` files
	// by injecting the Astro ambient types so type chains like `Astro.locals.*` resolve.
	// (`.astro` files themselves already enter the program via Volar's external files.)
	addAstroTypes(ts, info.languageServiceHost, [
		currentDir,
		...info.languageServiceHost.getScriptFileNames().map((fileName) => path.dirname(fileName)),
	]);

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

	let languagePlugins: LanguagePlugin<string>[] = [getLanguagePlugin()];

	if (collectionConfig) {
		languagePlugins.push(getFrontmatterLanguagePlugin([collectionConfig]));
	}

	return {
		languagePlugins,
	};
});
