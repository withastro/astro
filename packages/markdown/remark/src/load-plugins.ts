import { resolve as importMetaResolve } from 'import-meta-resolve';
import path from 'path';
import * as unified from 'unified';
import { pathToFileURL } from 'url';

const cwdUrlStr = pathToFileURL(path.join(process.cwd(), 'package.json')).toString();

async function importPlugin(p: string | unified.Plugin): Promise<unified.Plugin> {
	if (typeof p === 'string') {
		// Try import from this package first
		try {
			const importResult = await import(p);
			return importResult.default;
		} catch {}

		// Try import from user project
		const resolved = await importMetaResolve(p, cwdUrlStr);
		const importResult = await import(resolved);
		return importResult.default;
	}

	return p;
}

export function loadPlugins(
	items: (string | [string, any] | unified.Plugin<any[], any> | [unified.Plugin<any[], any>, any])[]
): Promise<[unified.Plugin, any?]>[] {
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
