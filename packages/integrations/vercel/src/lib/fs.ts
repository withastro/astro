import type { PathLike } from 'fs';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { nodeFileTrace } from '@vercel/nft';

export async function writeJson<T extends any>(path: PathLike, data: T) {
	await fs.writeFile(path, JSON.stringify(data), { encoding: 'utf-8' });
}

export async function emptyDir(dir: PathLike): Promise<void> {
	await fs.rm(dir, { recursive: true, force: true, maxRetries: 3 });
	await fs.mkdir(dir, { recursive: true });
}

export const getVercelOutput = (root: URL) => new URL('./.vercel/output/', root);

export async function copyFunctionNFT(root: URL, functionFolder: URL, serverEntry: string) {
	const result = await nodeFileTrace([fileURLToPath(new URL(`./${serverEntry}`, functionFolder))], {
		base: fileURLToPath(root),
	});

	for (const file of result.fileList) {
		if (file.startsWith('.vercel/')) continue;
		const origin = new URL(file, root);
		const dest = new URL(file, functionFolder);

		const meta = await fs.stat(origin);
		const isSymlink = (await fs.lstat(origin)).isSymbolicLink();

		// Create directories
		if (meta.isDirectory() && !isSymlink) {
			await fs.mkdir(new URL('..', dest), { recursive: true });
		} else {
			await fs.mkdir(new URL('.', dest), { recursive: true });
		}

		if (isSymlink) {
			const link = await fs.readlink(origin);
			await fs.symlink(link, dest, meta.isDirectory() ? 'dir' : 'file');
		} else {
			await fs.copyFile(origin, dest);
		}
	}
}
