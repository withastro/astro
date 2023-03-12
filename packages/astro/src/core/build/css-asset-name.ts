import type { GetModuleInfo } from 'rollup';

import crypto from 'crypto';
import npath from 'path';
import type { AstroSettings } from '../../@types/astro';
import { viteID } from '../util.js';
import { getTopLevelPages } from './graph.js';

// The short name for when the hash can be included
// We could get rid of this and only use the createSlugger implementation, but this creates
// slightly prettier names.
export function shortHashedName(id: string, ctx: { getModuleInfo: GetModuleInfo }): string {
	const parents = Array.from(getTopLevelPages(id, ctx));
	const firstParentId = parents[0]?.[0].id;
	const firstParentName = firstParentId ? npath.parse(firstParentId).name : 'index';

	const hash = crypto.createHash('sha256');
	for (const [page] of parents) {
		hash.update(page.id, 'utf-8');
	}
	const h = hash.digest('hex').slice(0, 8);
	const proposedName = firstParentName + '.' + h;
	return proposedName;
}

export function createSlugger(settings: AstroSettings) {
	const pagesDir = viteID(new URL('./pages', settings.config.srcDir));
	const indexPage = viteID(new URL('./pages/index', settings.config.srcDir));
	const map = new Map<string, Map<string, number>>();
	const sep = '-';
	return function (id: string, ctx: { getModuleInfo: GetModuleInfo }): string {
		const parents = Array.from(getTopLevelPages(id, ctx));
		const allParentsKey = parents
			.map(([page]) => page.id)
			.sort()
			.join('-');
		const firstParentId = parents[0]?.[0].id || indexPage;

		// Use the last two segments, for ex /docs/index
		let dir = firstParentId;
		let key = '';
		let i = 0;
		while (i < 2) {
			if (dir === pagesDir) {
				break;
			}

			const name = npath.parse(npath.basename(dir)).name;
			key = key.length ? name + sep + key : name;
			dir = npath.dirname(dir);
			i++;
		}

		// Keep track of how many times this was used.
		let name = key;

		// The map keeps track of how many times a key, like `pages_index` is used as the name.
		// If the same key is used more than once we increment a number so it becomes `pages-index-1`.
		// This guarantees that it stays unique, without sacrificing pretty names.
		if (!map.has(key)) {
			map.set(key, new Map([[allParentsKey, 0]]));
		} else {
			const inner = map.get(key)!;
			if (inner.has(allParentsKey)) {
				const num = inner.get(allParentsKey)!;
				if (num > 0) {
					name = name + sep + num;
				}
			} else {
				const num = inner.size;
				inner.set(allParentsKey, num);
				name = name + sep + num;
			}
		}

		return name;
	};
}
