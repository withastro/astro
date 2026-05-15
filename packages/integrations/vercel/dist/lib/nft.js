import { relative as relativePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { copyFilesToFolder } from '@astrojs/internal-helpers/fs';
import { appendForwardSlash } from '@astrojs/internal-helpers/path';
import { searchForWorkspaceRoot } from './searchRoot.js';
async function copyDependenciesToFunction(
	{ entry, outDir, includeFiles, excludeFiles, logger, root },
	cache,
) {
	const entryPath = fileURLToPath(entry);
	logger.info(`Bundling function ${relativePath(fileURLToPath(outDir), entryPath)}`);
	const base = pathToFileURL(appendForwardSlash(searchForWorkspaceRoot(fileURLToPath(root))));
	const { nodeFileTrace } = await import('@vercel/nft');
	const result = await nodeFileTrace([entryPath], {
		base: fileURLToPath(base),
		cache,
	});
	for (const error of result.warnings) {
		if (error.message.startsWith('Failed to resolve dependency')) {
			const [, module, file] = /Cannot find module '(.+?)' loaded from (.+)/.exec(error.message);
			if (module === '@astrojs/') continue;
			if (module === 'sharp') continue;
			if (entryPath === file) {
				logger.debug(
					`[@astrojs/vercel] The module "${module}" couldn't be resolved. This may not be a problem, but it's worth checking.`,
				);
			} else {
				logger.debug(
					`[@astrojs/vercel] The module "${module}" inside the file "${file}" couldn't be resolved. This may not be a problem, but it's worth checking.`,
				);
			}
		} else if (error.message.startsWith('Failed to parse')) {
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
export { copyDependenciesToFunction };
