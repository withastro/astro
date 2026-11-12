import { dirname, isAbsolute, relative as relativePath, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { copyFilesToFolder } from '@astrojs/internal-helpers/fs';
import { appendForwardSlash } from '@astrojs/internal-helpers/path';
import type { AstroIntegrationLogger } from 'astro';
import { searchForWorkspaceRoot } from './searchRoot.js';

export function findCommonAncestor(rootPath: string, entryPath: string): string {
	let ancestor = rootPath;
	let relativeEntryPath = relativePath(ancestor, entryPath);

	while (
		relativeEntryPath === '..' ||
		relativeEntryPath.startsWith(`..${sep}`) ||
		isAbsolute(relativeEntryPath)
	) {
		const parent = dirname(ancestor);
		if (parent === ancestor) break;
		ancestor = parent;
		relativeEntryPath = relativePath(ancestor, entryPath);
	}

	return ancestor;
}

export function handleDependencyWarning(
	error: Error,
	entryPath: string,
	logger: Pick<AstroIntegrationLogger, 'debug' | 'warn'>,
): void {
	const match = /Cannot find module '(.+?)' loaded from (.+)/.exec(error.message);
	if (!match) {
		// NFT returns resolved files alongside warnings, so a failed resolution does not invalidate the rest of the trace.
		logger.warn(error.message);
		return;
	}

	const [, module, file] = match;
	if (module === '@astrojs/') return;
	if (module === 'sharp') return;

	if (entryPath === file) {
		logger.debug(
			`[@astrojs/vercel] The module "${module}" couldn't be resolved. This may not be a problem, but it's worth checking.`,
		);
	} else {
		logger.debug(
			`[@astrojs/vercel] The module "${module}" inside the file "${file}" couldn't be resolved. This may not be a problem, but it's worth checking.`,
		);
	}
}

export async function copyDependenciesToFunction(
	{
		entry,
		outDir,
		includeFiles,
		excludeFiles,
		logger,
		root,
	}: {
		entry: URL;
		outDir: URL;
		includeFiles: URL[];
		excludeFiles: URL[];
		logger: Pick<AstroIntegrationLogger, 'info' | 'debug' | 'warn'>;
		root: URL;
	},
	// we want to pass the caching by reference, and not by value
	cache: object,
	trace?: typeof import('@vercel/nft').nodeFileTrace,
): Promise<{
	handler: string;
}> {
	const entryPath = fileURLToPath(entry);
	logger.info(`Bundling function ${relativePath(fileURLToPath(outDir), entryPath)}`);

	// NFT only traces files within `base`, so it must encompass the project root and build output.
	// https://github.com/withastro/astro/issues/17761
	const searchStart = findCommonAncestor(fileURLToPath(root), entryPath);
	const base = pathToFileURL(appendForwardSlash(searchForWorkspaceRoot(searchStart)));

	// The Vite bundle includes an import to `@vercel/nft` for some reason,
	// and that trips up `@vercel/nft` itself during the adapter build. Using a
	// dynamic import helps prevent the issue.
	// TODO: investigate why
	const nodeFileTrace = trace ?? (await import('@vercel/nft')).nodeFileTrace;
	const result = await nodeFileTrace([entryPath], {
		base: fileURLToPath(base),
		ignore: (glob) => glob.startsWith('**'),
		cache,
	});

	for (const error of result.warnings) {
		if (error.message.startsWith('Failed to resolve dependency')) {
			handleDependencyWarning(error, entryPath, logger);
		}
		// parse errors are likely not js and can safely be ignored,
		// such as this html file in "main" meant for nw instead of node:
		// https://github.com/vercel/nft/issues/311
		else if (error.message.startsWith('Failed to parse')) {
			continue;
		} else {
			throw error;
		}
	}

	const commonAncestor = await copyFilesToFolder(
		[...result.fileList].map((file) => new URL(file, base)).concat(includeFiles),
		outDir,
		excludeFiles,
	);

	return {
		// serverEntry location inside the outDir
		handler: relativePath(commonAncestor, entryPath),
	};
}
