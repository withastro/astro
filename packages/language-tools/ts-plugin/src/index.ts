import path from 'node:path';
import type { LanguagePlugin } from '@volar/language-core';
import { createLanguageServicePlugin } from '@volar/typescript/lib/quickstart/createLanguageServicePlugin.js';
import type ts from 'typescript';
import type { CollectionConfig } from './frontmatter.js';
import { getFrontmatterLanguagePlugin } from './frontmatter.js';
import { getLanguagePlugin } from './language.js';

/**
 * Finds the directory of the `astro` package installed in the project.
 * Returns the resolved directory path, or undefined if not found.
 */
function findAstroDirectory(
	typescript: typeof import('typescript'),
	currentDir: string,
): string | undefined {
	// Try to resolve `astro/package.json` from the project directory to find the astro installation
	const resolved = typescript.resolveModuleName(
		'astro/package.json',
		path.join(currentDir, '__dummy.ts'),
		{ moduleResolution: typescript.ModuleResolutionKind.Bundler },
		typescript.sys,
	);
	if (resolved.resolvedModule) {
		// resolved.resolvedModule.resolvedFileName is e.g. /path/to/node_modules/astro/package.json
		return path.dirname(resolved.resolvedModule.resolvedFileName);
	}

	// Fallback: check common node_modules paths
	const candidates = [
		path.join(currentDir, 'node_modules', 'astro'),
		path.join(currentDir, '..', 'node_modules', 'astro'),
	];
	for (const candidate of candidates) {
		if (typescript.sys.fileExists(path.join(candidate, 'package.json'))) {
			return candidate;
		}
	}

	return undefined;
}

/**
 * Injects Astro-specific type declaration files (env.d.ts, astro-jsx.d.ts) into
 * the TypeScript program. This makes `Astro` and `Fragment` globals available
 * in `.astro` file virtual code, enabling features like "Find All References"
 * for members accessed through `Astro.locals`.
 *
 * This mirrors the language server's `addAstroTypes()` function.
 */
function addAstroTypes(
	typescript: typeof import('typescript'),
	host: ts.server.PluginCreateInfo['languageServiceHost'],
	astroDirectory: string,
) {
	const getScriptFileNames = host.getScriptFileNames.bind(host);

	host.getScriptFileNames = () => {
		const fileNames = getScriptFileNames();
		const addedFileNames = ['./env.d.ts', './astro-jsx.d.ts']
			.map((filePath) => typescript.sys.resolvePath(path.resolve(astroDirectory, filePath)))
			.filter((f) => typescript.sys.fileExists(f));
		return [...fileNames, ...addedFileNames];
	};
}

export = createLanguageServicePlugin((ts, info) => {
	let collectionConfig = undefined;
	const currentDir = info.project.getCurrentDirectory();

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

	// Inject Astro type declarations so that `Astro` and `Fragment` globals are
	// available in the virtual TSX for `.astro` files. Without this, TypeScript
	// cannot resolve types through `Astro.locals`, breaking features like
	// "Find All References" for members accessed via ambient type chains.
	const astroDirectory = findAstroDirectory(ts, currentDir);
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
