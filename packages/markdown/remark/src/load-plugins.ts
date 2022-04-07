import * as unified from 'unified';
import type { Plugin } from './types';

async function importPlugin(p: string | unified.Plugin): Promise<unified.Plugin> {
	if (typeof p === 'string') {
		const importResult = await import(p);
		return importResult.default;
	}

	return p;
}

export function loadPlugins(items: Plugin[]): Promise<[unified.Plugin, any?]>[] {
	return items.map((p) => {
		return new Promise((resolve, reject) => {
			if (Array.isArray(p)) {
				const [plugin, opts] = p;
				return importPlugin(plugin)
					.then((m) => resolve([m, opts]))
					.catch((e) => reject(e));
			}

			return importPlugin(p)
				.then((m) => resolve([m]))
				.catch((e) => reject(e));
		});
	});
}
