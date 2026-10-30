import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isWindows = process.platform === 'win32';

export function removeEmptyDirs(dir: string): void {
	if (!fs.statSync(dir).isDirectory()) return;
	let files = fs.readdirSync(dir);

	if (files.length > 0) {
		files.map((file) => {
			removeEmptyDirs(path.join(dir, file));
		});
		files = fs.readdirSync(dir);
	}

	if (files.length === 0) {
		fs.rmdirSync(dir);
	}
}

/**
 * Copies a cached file to `destination`, giving the copy the source file's
 * access and modification times so restored output reflects when it was cached.
 */
export async function copyCachedFile(source: fs.PathLike, destination: fs.PathLike): Promise<void> {
	await fs.promises.copyFile(source, destination, fs.constants.COPYFILE_FICLONE);
	// `copyFile` only keeps timestamps where the clone preserves them (macOS),
	// so they are set explicitly for consistent output across platforms (#18402).
	const { atime, mtime } = await fs.promises.stat(source);
	await fs.promises.utimes(destination, atime, mtime);
}

/**
 * Gives each file in `destDir` the access and modification times of the file at
 * the same relative path in `srcDir`. Files missing from `destDir` are skipped.
 */
export async function copyTimestamps(srcDir: URL, destDir: URL): Promise<void> {
	const src = fileURLToPath(srcDir);
	const dest = fileURLToPath(destDir);
	if (!fs.existsSync(src)) return;
	const entries = await fs.promises.readdir(src, { recursive: true, withFileTypes: true });
	await Promise.all(
		entries
			.filter((entry) => entry.isFile())
			.map(async (entry) => {
				const srcFile = path.join(entry.parentPath, entry.name);
				const destFile = path.join(dest, path.relative(src, srcFile));
				const { atime, mtime } = await fs.promises.stat(srcFile);
				try {
					await fs.promises.utimes(destFile, atime, mtime);
				} catch (err: any) {
					if (err.code !== 'ENOENT') throw err;
				}
			}),
	);
}

export function emptyDir(_dir: URL, skip?: Set<string>): void {
	const dir = fileURLToPath(_dir);
	if (!fs.existsSync(dir)) return undefined;
	for (const file of fs.readdirSync(dir)) {
		if (skip?.has(file)) {
			continue;
		}

		const p = path.resolve(dir, file);
		const rmOptions = { recursive: true, force: true, maxRetries: 3 };

		try {
			fs.rmSync(p, rmOptions);
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
const fixWinEPERMSync = (p: string, options: fs.RmOptions, er: any) => {
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
		fs.rmSync(p, options);
	} else {
		fs.unlinkSync(p);
	}
};
