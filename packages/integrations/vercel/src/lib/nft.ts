import { nodeFileTrace } from '@vercel/nft';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export async function copyDependenciesToFunction(
	root: URL,
	functionFolder: URL,
	serverEntry: string
) {
	const entryPath = fileURLToPath(new URL(`./${serverEntry}`, functionFolder));

	const result = await nodeFileTrace([entryPath], {
		base: fileURLToPath(root),
	});

	for (const file of result.fileList) {
		if (file.startsWith('.vercel/')) continue;
		const origin = new URL(file, root);
		const dest = new URL(file, functionFolder);

		const meta = await fs.stat(origin);
		const isSymlink = (await fs.lstat(origin)).isSymbolicLink();

		// Create directories recursively
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
