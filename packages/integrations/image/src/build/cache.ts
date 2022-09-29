import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LoggerLevel } from '../utils/logger.js';
import { debug, warn } from '../utils/logger.js';

const CACHE_FILE = `cache.json`;

interface Cache {
	[filename: string]: { expires: number };
}

export class ImageCache {
	#cacheDir: URL;
	#cacheFile: URL;
	#cache: Cache = {};
	#logLevel: LoggerLevel;

	constructor(dir: URL, logLevel: LoggerLevel) {
		this.#logLevel = logLevel;
		this.#cacheDir = dir;
		this.#cacheFile = this.#toAbsolutePath(CACHE_FILE);
	}

	#toAbsolutePath(file: string) {
		return new URL(path.join(this.#cacheDir.toString(), file));
	}

	async init() {
		try {
			const str = await fs.readFile(this.#cacheFile, 'utf-8');
			this.#cache = JSON.parse(str) as Cache;
		} catch {
			// noop
			debug({ message: 'no cache file found', level: this.#logLevel });
		}
	}

	async finalize() {
		try {
			await fs.mkdir(path.dirname(fileURLToPath(this.#cacheFile)), { recursive: true });
			await fs.writeFile(this.#cacheFile, JSON.stringify(this.#cache));
		} catch {
			// noop
			warn({ message: 'could not save the cache file', level: this.#logLevel });
		}
	}

	async get(file: string): Promise<Buffer | undefined> {
		if (!this.has(file)) {
			return undefined;
		}

		try {
			const filepath = this.#toAbsolutePath(file);
			return await fs.readFile(filepath);
		} catch {
			warn({ message: `could not load cached file for "${file}"`, level: this.#logLevel });
			return undefined;
		}
	}

	async set(file: string, buffer: Buffer, opts: Cache['string']): Promise<void> {
		try {
			const filepath = this.#toAbsolutePath(file);
			await fs.mkdir(path.dirname(fileURLToPath(filepath)), { recursive: true });
			await fs.writeFile(filepath, buffer);

			this.#cache[file] = opts;
		} catch {
			// noop
			warn({ message: `could not save cached copy of "${file}"`, level: this.#logLevel });
		}
	}

	has(file: string): boolean {
		if (!(file in this.#cache)) {
			return false;
		}

		const { expires } = this.#cache[file];

		return expires > Date.now();
	}
}
