import type { PathLike } from 'node:fs';
import * as fs from 'node:fs/promises';

export async function writeJson<T extends any>(path: PathLike, data: T) {
	await fs.writeFile(path, JSON.stringify(data), { encoding: 'utf-8' });
}

export async function emptyDir(dir: PathLike): Promise<void> {
	await fs.rm(dir, { recursive: true, force: true, maxRetries: 3 });
	await fs.mkdir(dir, { recursive: true });
}

export const getVercelOutput = (root: URL) => new URL('./.vercel/output/', root);
