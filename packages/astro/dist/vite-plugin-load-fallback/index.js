import nodeFs from 'node:fs';
import npath from 'node:path';
import { slash } from '../core/path.js';
import { cleanUrl } from '../vite-plugin-utils/index.js';
const FALLBACK_FLAG = 'astroFallbackFlag';
function loadFallbackPlugin({ fs, root }) {
	if (!fs || fs === nodeFs || fs.default === nodeFs) {
		return [];
	}
	const tryLoadModule = async (id) => {
		try {
			return await fs.promises.readFile(cleanUrl(id), 'utf-8');
		} catch {
			try {
				return await fs.promises.readFile(id, 'utf-8');
			} catch {
				try {
					const fullpath = new URL('.' + id, root);
					return await fs.promises.readFile(fullpath, 'utf-8');
				} catch {}
			}
		}
	};
	return [
		{
			name: 'astro:load-fallback',
			enforce: 'post',
			async resolveId(id, parent) {
				if (parent) {
					const candidateId = npath.posix.join(npath.posix.dirname(slash(parent)), id);
					try {
						const stats = await fs.promises.stat(candidateId);
						if (!stats.isDirectory()) {
							const params = new URLSearchParams(FALLBACK_FLAG);
							return `${candidateId}?${params.toString()}`;
						}
					} catch {}
				}
			},
			load: {
				filter: {
					id: new RegExp(`(?:\\?|&)${FALLBACK_FLAG}(?:&|=|$)`),
				},
				async handler(id) {
					const code = await tryLoadModule(id.slice(0, -(1 + FALLBACK_FLAG.length)));
					if (code) {
						return { code };
					}
				},
			},
		},
		{
			name: 'astro:load-fallback-hmr',
			enforce: 'pre',
			handleHotUpdate(context) {
				const read = context.read;
				context.read = async () => {
					const source = await tryLoadModule(context.file);
					if (source) return source;
					return read.call(context);
				};
			},
		},
	];
}
export { loadFallbackPlugin as default };
