import nodeFs from 'fs';
import npath from 'path';
import slashify from 'slash';
import type * as vite from 'vite';
import type { AstroSettings } from '../@types/astro';

type NodeFileSystemModule = typeof nodeFs;

export interface LoadFallbackPluginParams {
	fs?: NodeFileSystemModule;
	settings: AstroSettings;
}

export default function loadFallbackPlugin({
	fs,
	settings,
}: LoadFallbackPluginParams): vite.Plugin[] | false {
	// Only add this plugin if a custom fs implementation is provided.
	if (!fs || fs === nodeFs) {
		return false;
	}

	const tryLoadModule = async (id: string) => {
		try {
			// await is necessary for the catch
			return await fs.promises.readFile(cleanUrl(id), 'utf-8');
		} catch (e) {
			try {
				return await fs.promises.readFile(id, 'utf-8');
			} catch (e2) {
				try {
					const fullpath = new URL('.' + id, settings.config.root);
					return await fs.promises.readFile(fullpath, 'utf-8');
				} catch (e3) {
					// Let fall through to the next
				}
			}
		}
	};

	return [
		{
			name: 'astro:load-fallback',
			enforce: 'post',
			async resolveId(id, parent) {
				if (id.startsWith('.') && parent && fs.existsSync(parent)) {
					return npath.posix.join(npath.posix.dirname(parent), id);
				} else {
					let resolved = await this.resolve(id, parent, { skipSelf: true });
					if (resolved) {
						return resolved.id;
					}
					return slashify(id);
				}
			},
			async load(id) {
				const source = await tryLoadModule(id);
				return source;
			},
		},
		{
			name: 'astro:load-fallback-hmr',
			enforce: 'pre',
			handleHotUpdate(context) {
				// Wrap context.read so it checks our filesystem first.
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

const queryRE = /\?.*$/s;
const hashRE = /#.*$/s;

const cleanUrl = (url: string): string => url.replace(hashRE, '').replace(queryRE, '');
