import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import glob from 'fast-glob';

export default async function copy() {
	const args = parseArgs({ allowPositionals: true });
	const patterns = args.positionals.slice(1);

	const files = await glob(patterns);
	await Promise.all(
		files.map((file) => {
			const dest = path.resolve(file.replace(/^[^/]+/, 'dist'));
			return fs
				.mkdir(path.dirname(dest), { recursive: true })
				.then(() => fs.copyFile(path.resolve(file), dest, fs.constants.COPYFILE_FICLONE));
		}),
	);
}
