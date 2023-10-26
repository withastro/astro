import fs from 'node:fs';
import { joinPaths } from './path.js';

/**
 * use .gitignore file to ignore files
 * @param root astro root path
 */
export async function ignoreFiles(root: string) {
	const res: string[] = [];
	const gitIgnoreFile = joinPaths(root, '.gitignore');
	const text = await fs.promises
		.readFile(gitIgnoreFile, 'utf-8')
		.then((data) => data.toString())
		.catch(() => '');
	
	if (text.length > 0) {
		const lines = text.split('\n');
		for (const line of lines) {
			if (!line.startsWith('#')) {
				const value = line.trim();
				if (value.length) {
					res.push(`**/${value}/**`);
				}
			}
		}
	}
	return res;
}
