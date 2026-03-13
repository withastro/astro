import { createHash } from 'node:crypto';
import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { copyFilesToFolder } from '@astrojs/internal-helpers/fs';
import { appendForwardSlash } from '@astrojs/internal-helpers/path';
import type { AstroIntegrationLogger } from 'astro';
import { searchForWorkspaceRoot } from './searchRoot.js';

const FUNC_CACHE_DIR = join(process.cwd(), 'node_modules', '.astro', 'func-nm-cache');
const NFT_CACHE_DIR = join(process.cwd(), 'node_modules', '.astro', 'nft-filelist-cache');

/**
 * Attempt an APFS copy-on-write clone via `cp -rc` on macOS.
 * Returns true on success, false otherwise.
 */
function cloneDir(src: string, dest: string): boolean {
	if (process.platform !== 'darwin') return false;
	try {
		mkdirSync(dest, { recursive: true });
		const result = spawnSync('cp', ['-rc', src, dest]);
		return result.status === 0;
	} catch {
		return false;
	}
}

/**
 * Returns a short hash of the project's package-lock.json content,
 * used as the NFT file-list cache key. Returns null if the file is absent.
 */
function getNftCacheKey(): string | null {
	try {
		const content = readFileSync(join(process.cwd(), 'package-lock.json'));
		return createHash('sha256').update(content).digest('hex').slice(0, 16);
	} catch {
		return null;
	}
}

function readNftFileListCache(key: string): string[] | null {
	const file = join(NFT_CACHE_DIR, `${key}.json`);
	if (!existsSync(file)) return null;
	try {
		return JSON.parse(readFileSync(file, 'utf8'));
	} catch {
		return null;
	}
}

function writeNftFileListCache(key: string, nodeModulesList: string[]): void {
	mkdirSync(NFT_CACHE_DIR, { recursive: true });
	writeFileSync(join(NFT_CACHE_DIR, `${key}.json`), JSON.stringify(nodeModulesList));
}

/**
 * Walk `baseDir/dist/server/` and return relative paths of all files.
 */
function getDistServerFiles(baseDir: string): string[] {
	const distServer = join(baseDir, 'dist', 'server');
	const results: string[] = [];
	function walk(dir: string) {
		if (!existsSync(dir)) return;
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = join(dir, entry.name);
			if (entry.isDirectory()) walk(full);
			else results.push(relative(baseDir, full));
		}
	}
	walk(distServer);
	return results;
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
		logger: AstroIntegrationLogger;
		root: URL;
	},
	// we want to pass the caching by reference, and not by value
	cache: object,
): Promise<{
	handler: string;
}> {
	const entryPath = fileURLToPath(entry);
	logger.info(`Bundling function ${relative(fileURLToPath(outDir), entryPath)}`);

	// Set the base to the workspace root
	const base = pathToFileURL(appendForwardSlash(searchForWorkspaceRoot(fileURLToPath(root))));
	const baseStr = fileURLToPath(base);
	const outDirStr = fileURLToPath(outDir);

	// --- NFT file-list cache ---
	const nftKey = getNftCacheKey();
	let cachedFileList: string[] | null = nftKey ? readNftFileListCache(nftKey) : null;

	// --- Func node_modules clone cache ---
	const funcCacheKey = nftKey ?? 'no-lock';
	const funcCacheEntry = join(FUNC_CACHE_DIR, funcCacheKey);
	const funcCacheExists = existsSync(funcCacheEntry);

	let fileList: string[];

	if (cachedFileList) {
		logger.info(`[@astrojs/vercel] NFT file-list cache hit (key=${nftKey}), skipping nodeFileTrace`);
		fileList = cachedFileList;
	} else {
		// The Vite bundle includes an import to `@vercel/nft` for some reason,
		// and that trips up `@vercel/nft` itself during the adapter build. Using a
		// dynamic import helps prevent the issue.
		// TODO: investigate why
		const { nodeFileTrace } = await import('@vercel/nft');
		const result = await nodeFileTrace([entryPath], {
			base: baseStr,
			cache,
		});

		for (const error of result.warnings) {
			if (error.message.startsWith('Failed to resolve dependency')) {
				const [, module, file] = /Cannot find module '(.+?)' loaded from (.+)/.exec(
					error.message,
				)!;

				// The import(astroRemark) sometimes fails to resolve, but it's not a problem
				if (module === '@astrojs/') continue;

				// Sharp is always external and won't be able to be resolved, but that's also not a problem
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

		fileList = [...result.fileList];

		// Persist the NFT file list for next build
		if (nftKey) {
			const nodeModulesFiles = fileList.filter((f) => f.includes('node_modules'));
			writeNftFileListCache(nftKey, nodeModulesFiles);
		}
	}

	// --- Func node_modules clone cache: save/restore ---
	if (funcCacheExists && cachedFileList) {
		// Restore node_modules from APFS clone cache
		logger.info(`[@astrojs/vercel] Restoring func node_modules from clone cache`);
		const destNm = join(outDirStr, 'node_modules');
		const cloned = cloneDir(funcCacheEntry, destNm);
		if (!cloned) {
			// Fall back: copy the node_modules files from the file list
			const nmFiles = fileList
				.filter((f) => f.includes('node_modules'))
				.map((f) => new URL(f, base));
			await copyFilesToFolder(nmFiles.concat(includeFiles), outDir, excludeFiles);
		}

		// Clone dist/server/ into the function bundle (APFS CoW)
		const distServerFiles = getDistServerFiles(process.cwd());
		if (distServerFiles.length > 0 && process.platform === 'darwin') {
			const srcDistServer = join(process.cwd(), 'dist', 'server');
			const destDistServer = join(outDirStr, 'dist', 'server');
			cloneDir(srcDistServer, destDistServer);
		}
	} else {
		const commonAncestor = await copyFilesToFolder(
			fileList.map((file) => new URL(file, base)).concat(includeFiles),
			outDir,
			excludeFiles,
		);

		// Save a clone of the assembled node_modules for next build
		if (nftKey && process.platform === 'darwin') {
			const srcNm = join(outDirStr, 'node_modules');
			if (existsSync(srcNm)) {
				mkdirSync(FUNC_CACHE_DIR, { recursive: true });
				cloneDir(srcNm, funcCacheEntry);
			}
		}

		return {
			// serverEntry location inside the outDir
			handler: relative(commonAncestor, entryPath),
		};
	}

	return {
		handler: relative(outDirStr, entryPath),
	};
}
