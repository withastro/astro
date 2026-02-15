import type { LanguagePlugin } from '@volar/language-core';
import { createLanguageServicePlugin } from '@volar/typescript/lib/quickstart/createLanguageServicePlugin.js';
import type { CollectionConfig } from './frontmatter.js';
import { getFrontmatterLanguagePlugin } from './frontmatter.js';
import { getLanguagePlugin } from './language.js';

export = createLanguageServicePlugin((ts, info) => {
	const currentDir = info.project.getCurrentDirectory();

	// Check if this is an Astro project by looking for astro.config.* file
	if (ts.sys.readDirectory) {
		const hasAstroConfig =
			ts.sys.readDirectory(
				currentDir,
				['js', 'mjs', 'cjs', 'ts', 'mts', 'cts'],
				undefined,
				['astro.config.*'],
				1,
			).length > 0;

		if (!hasAstroConfig) {
			return { languagePlugins: [] };
		}
	}

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

	let languagePlugins: LanguagePlugin<string>[] = [getLanguagePlugin()];

	if (collectionConfig) {
		languagePlugins.push(getFrontmatterLanguagePlugin([collectionConfig]));
	}

	return {
		languagePlugins,
	};
});
