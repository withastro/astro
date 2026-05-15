'use strict';
const createLanguageServicePlugin_js_1 = require('@volar/typescript/lib/quickstart/createLanguageServicePlugin.js');
const frontmatter_js_1 = require('./frontmatter.js');
const language_js_1 = require('./language.js');
module.exports = (0, createLanguageServicePlugin_js_1.createLanguageServicePlugin)((ts, info) => {
	let collectionConfig = undefined;
	try {
		const currentDir = info.project.getCurrentDirectory();
		const fileContent = ts.sys.readFile(currentDir + '/.astro/collections/collections.json');
		if (fileContent) {
			collectionConfig = {
				folder: currentDir,
				config: JSON.parse(fileContent),
			};
		}
	} catch (err) {
		// If the file doesn't exist, we don't really care, but if it's something else, we want to know
		if (err && err.code !== 'ENOENT') console.error(err);
	}
	let languagePlugins = [(0, language_js_1.getLanguagePlugin)()];
	if (collectionConfig) {
		languagePlugins.push((0, frontmatter_js_1.getFrontmatterLanguagePlugin)([collectionConfig]));
	}
	return {
		languagePlugins,
	};
});
