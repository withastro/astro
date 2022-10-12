import { nodeFileTrace } from '@vercel/nft';
import * as fs from 'node:fs/promises';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';

export async function copyDependenciesToFunction(
	entry: URL,
	outDir: URL
): Promise<{ handler: string }> {
	const entryPath = fileURLToPath(entry);

	// Get root of folder of the system (like C:\ on Windows or / on Linux)
	let base = entry;
	while (fileURLToPath(base) !== fileURLToPath(new URL('../', base))) {
		base = new URL('../', base);
	}

	const result = await nodeFileTrace([entryPath], {
		base: fileURLToPath(base),
	});

	if (result.fileList.size === 0) throw new Error('[@astrojs/vercel] No files found');

	for (const error of result.warnings) {
		if (error.message.startsWith('Failed to resolve dependency')) {
			const [, module, file] = /Cannot find module '(.+?)' loaded from (.+)/.exec(error.message)!;

			// The import(astroRemark) sometimes fails to resolve, but it's not a problem
			if (module === '@astrojs/') continue;

			if (entryPath === file) {
				console.warn(
					`[@astrojs/vercel] The module "${module}" couldn't be resolved. This may not be a problem, but it's worth checking.`
				);
			} else {
				console.warn(
					`[@astrojs/vercel] The module "${module}" inside the file "${file}" couldn't be resolved. This may not be a problem, but it's worth checking.`
				);
			}
		} else {
			throw error;
		}
	}

	const fileList = [...result.fileList];

	let commonAncestor = nodePath.dirname(fileList[0]);
	for (const file of fileList.slice(1)) {
		while (!file.startsWith(commonAncestor)) {
			commonAncestor = nodePath.dirname(commonAncestor);
		}
	}

	for (const file of fileList) {
		const origin = new URL(file, base);
		const dest = new URL(nodePath.relative(commonAncestor, file), outDir);

		const realpath = await fs.realpath(origin);
		const isSymlink = realpath !== fileURLToPath(origin);
		const isDir = (await fs.stat(origin)).isDirectory();

		// Create directories recursively
		if (isDir && !isSymlink) {
			await fs.mkdir(new URL('..', dest), { recursive: true });
		} else {
			await fs.mkdir(new URL('.', dest), { recursive: true });
		}

		if (isSymlink) {
			const realdest = fileURLToPath(
				new URL(
					nodePath.relative(nodePath.join(fileURLToPath(base), commonAncestor), realpath),
					outDir
				)
			);
			await fs.symlink(
				nodePath.relative(fileURLToPath(new URL('.', dest)), realdest),
				dest,
				isDir ? 'dir' : 'file'
			);
		} else if (!isDir) {
			await fs.copyFile(origin, dest);
		}
	}

	return {
		// serverEntry location inside the outDir
		handler: nodePath.relative(nodePath.join(fileURLToPath(base), commonAncestor), entryPath),
	};
}
