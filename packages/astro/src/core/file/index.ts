import type { AstroConfig } from '../../@types/astro';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { normalizePath } from 'vite';
import { prependForwardSlash } from '../path.js';
import { unwrapId, viteID } from '../util.js';

export type PathType =
	/**
	 * file:///Users/name/projects/todos/src/pages/index.astro
	 */
	'url' |
	/**
	 * /Users/name/projects/todos/src/pages/index.astro
	 */
	'absolute' |
	/**
	 * /@fs/Users/name/projects/todos/src/pages/index.astro
	 */
	'vite-fs-path' |
	/**
	 * /src/pages/index.astro
	 */
	'root-relative' |
	/**
	 * We don't know
	 */
	'unknown';

class File {
	public raw: string;
	public root: URL;
	public type: PathType;
	constructor(raw: string | URL, rootOrConfig: URL | Pick<AstroConfig, 'root'>) {
		this.raw = typeof raw === 'string' ? raw : raw.toString();
		this.root = rootOrConfig instanceof URL ? rootOrConfig : rootOrConfig.root;
		this.type = File.getPathType(this.raw, this.root);
	}

	/**
	 * Convert a raw path to a File URL
	 */
	toFileURL(): URL {
		switch(this.type) {
			case 'url': return new URL(this.raw);
			case 'absolute': return pathToFileURL(this.raw);
			case 'vite-fs-path': {
				const fsPath = this.raw.slice('/@fs'.length);
				return pathToFileURL(fsPath);
			}
			case 'root-relative': {
				return new URL('.' + this.raw, this.root);
			}
			default: {
				throw new Error(`Cannot create file URL for an unknown path type: ${this.raw}`);
			}
		}
	}

	/**
	 * Converts to a path that is relative to the root, for use in browser paths
	 */
	toRootRelativePath() {
		const url = this.toFileURL();
		const id = unwrapId(viteID(url));
		return prependForwardSlash(id.slice(normalizePath(fileURLToPath(this.root)).length));
	}

	/**
	 * Converts to the absolute (string) path. Uses the platform's path separator.
	 */
	toAbsolutePath() {
		return fileURLToPath(this.toFileURL());
	}

	/**
	 * Converts to a path for use in browser, contains the `/@fs` prefix understood by Vite.
	 */
	toViteFSPath() {
		const abs = prependForwardSlash(normalizePath(this.toAbsolutePath()));
		return '/@fs' + abs;
	}

	static getPathType(raw: string, root: URL): PathType {
		if(raw.startsWith('/@fs')) {
			return 'vite-fs-path';
		}
		
		if(raw.startsWith('/')) {
			const normalRoot = normalizePath(fileURLToPath(root))
			if(raw.startsWith(normalRoot)) {
				return 'absolute';
			} else {
				return 'root-relative';
			}
		}

		if(raw.startsWith('file://')) {
			return 'url';
		}

		// Windows drive
		if(/[A-Z]:/.test(raw)) {
			return 'absolute';
		}

		return 'unknown';
	}
}

export {
	File,
	File as default
}
