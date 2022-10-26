import type * as vite from 'vite';
import nodeFs from 'fs';

type NodeFileSystemModule = typeof nodeFs;

export interface LoadFallbackPluginParams {
	fs?: NodeFileSystemModule;
}

export default function loadFallbackPlugin({ fs }: LoadFallbackPluginParams): vite.Plugin | false {
	// Only add this plugin if a custom fs implementation is provided.
	if(!fs || fs === nodeFs) {
		return false;
	}

  return {
    name: 'astro:load-fallback',
		enforce: 'post',
    async load(id) {
      try {
				// await is necessary for the catch
        return await fs.promises.readFile(cleanUrl(id), 'utf-8')
      } catch (e) {
        try {
					return await fs.promises.readFile(id, 'utf-8');
				} catch(e2) {
					// Let fall through to the next
				}
      }
    }
  }
}

const queryRE = /\?.*$/s;
const hashRE = /#.*$/s;

const cleanUrl = (url: string): string =>
	url.replace(hashRE, '').replace(queryRE, '');
