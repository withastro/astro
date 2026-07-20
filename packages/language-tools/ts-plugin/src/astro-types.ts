import path from 'node:path';
import type ts from 'typescript';

const decoratedHosts = new WeakSet<ts.LanguageServiceHost>();

/**
 * Walk up from the given directories until an installed `astro` package is found,
 * returning the directory that contains its `package.json`.
 */
export function findAstroPackageDirectory(
	tsModule: typeof import('typescript'),
	currentDirectory: string | string[],
): string | undefined {
	for (const candidate of Array.isArray(currentDirectory) ? currentDirectory : [currentDirectory]) {
		const astroDirectory = findAstroPackageDirectoryFrom(tsModule, candidate);
		if (astroDirectory) {
			return astroDirectory;
		}
	}
}

function findAstroPackageDirectoryFrom(
	tsModule: typeof import('typescript'),
	currentDirectory: string,
): string | undefined {
	let directory = tsModule.sys.resolvePath(currentDirectory);

	while (true) {
		const packageJson = path.join(directory, 'node_modules', 'astro', 'package.json');
		if (tsModule.sys.fileExists(packageJson)) {
			return path.dirname(packageJson);
		}

		const parent = path.dirname(directory);
		if (parent === directory) {
			return undefined;
		}
		directory = parent;
	}
}

/**
 * Inject the installed Astro package's `env.d.ts` and `astro-jsx.d.ts` into the
 * TypeScript program. Without these, the `Astro` global is undeclared and the type
 * chain through `Astro.locals` can't be resolved, so "Go To References" from a `.ts`
 * file misses usages inside `.astro` files. Mirrors the language server's
 * `addAstroTypes()`.
 */
export function addAstroTypes(
	tsModule: typeof import('typescript'),
	host: ts.LanguageServiceHost,
	currentDirectory: string | string[],
) {
	if (decoratedHosts.has(host)) {
		return;
	}

	const astroDirectory = findAstroPackageDirectory(tsModule, currentDirectory);
	if (!astroDirectory) {
		return;
	}

	const addedFileNames = ['./env.d.ts', './astro-jsx.d.ts']
		.map((filePath) => tsModule.sys.resolvePath(path.resolve(astroDirectory, filePath)))
		.filter((fileName) => tsModule.sys.fileExists(fileName));

	if (!addedFileNames.length) {
		return;
	}

	decoratedHosts.add(host);

	const getScriptFileNames = host.getScriptFileNames.bind(host);
	host.getScriptFileNames = () => {
		const fileNames = getScriptFileNames();
		const seen = new Set(fileNames);
		return [...fileNames, ...addedFileNames.filter((fileName) => !seen.has(fileName))];
	};
}
