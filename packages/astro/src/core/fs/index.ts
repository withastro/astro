import fs, { promises as fsPromises } from 'fs';
import path from 'path';

const isWindows = process.platform === 'win32';

const convertToPath = (dir: URL | string): string => {
	if (dir instanceof URL) {
		return path.resolve(dir.pathname);
	} else {
		return path.resolve(dir);
	}
};

/** An fs utility, similar to `rimraf` or `rm -rf` */
export async function removeDir(dir: URL | string): Promise<void> {
	const dirPath = convertToPath(dir);
	fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3 });
}

export async function removeEmptyDirs(dir: URL | string): Promise<void> {
	const rootPath = convertToPath(dir),
		dirPaths = [rootPath];

	while (dirPaths.length > 0) {
		const dirPath = dirPaths.pop()!;
		// dirPaths
		if ((await fsPromises.stat(dirPath)).isDirectory()) {
      const children = await fsPromises.readdir(dirPath);
			if (children.length === 0) {
				await fsPromises.rmdir(dirPath);
        const parentDir = path.resolve(dirPath, "..");
        // recheck parent path
        if (!dirPaths.includes(parentDir)) {
          dirPaths.push(parentDir);
        }
			} else {
				dirPaths.push(...children.map((child) => path.join(dirPath, child)));
			}
		}
	}
}

export async function emptyDir(dir: URL | string, skip?: Set<string>): Promise<void> {
	const dirPath = convertToPath(dir);

	// check if file exists
	try {
		await fsPromises.stat(dirPath);
	} catch (err) {
		return;
	}

	const rmOptions = { recursive: true, force: true, maxRetries: 3 };
	for (const file of await fsPromises.readdir(dirPath)) {
		if (skip?.has(file)) {
			continue;
		}

		const p = path.resolve(dirPath, file);
		try {
			await fsPromises.rm(p, rmOptions);
		} catch (er: any) {
			if (er.code === 'ENOENT') {
				return;
			}
			if (er.code === 'EPERM' && isWindows) {
				fixWinEPERMSync(p, rmOptions, er);
			}
		}
	}
}

/**
 * https://github.com/isaacs/rimraf/blob/8c10fb8d685d5cc35708e0ffc4dac9ec5dd5b444/rimraf.js#L183
 * @license ISC
 * The ISC License
 *
 * Copyright (c) Isaac Z. Schlueter and Contributors
 *
 * Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
const fixWinEPERMSync = (p: string, options: fs.RmDirOptions, er: any) => {
	try {
		fs.chmodSync(p, 0o666);
	} catch (er2: any) {
		if (er2.code === 'ENOENT') {
			return;
		} else {
			throw er;
		}
	}

	let stats;
	try {
		stats = fs.statSync(p);
	} catch (er3: any) {
		if (er3.code === 'ENOENT') {
			return;
		} else {
			throw er;
		}
	}

	if (stats.isDirectory()) {
		fs.rmdirSync(p, options);
	} else {
		fs.unlinkSync(p);
	}
};
