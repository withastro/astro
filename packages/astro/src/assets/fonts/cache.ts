import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type * as unifont from 'unifont';

interface Options {
	bases: Array<URL>;
}

type Storage = Required<unifont.UnifontOptions>['storage'];

export const createStorage = ({ bases }: Options): Storage => {
	return {
		getItem: async (key) => {
			for (const base of bases) {
				const dest = new URL(key, base);
				if (!existsSync(dest)) {
					return;
				}
				return JSON.parse(await readFile(dest, 'utf-8'));
			}
		},
		setItem: async (key, value) => {
			for (const base of bases) {
				const dest = new URL(key, base);
				await mkdir(dirname(fileURLToPath(dest)), { recursive: true });
				return await writeFile(dest, JSON.stringify(value), 'utf-8');
			}
		},
	};
};
