import type { Plugin } from 'vite';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { SERIALIZED_MANIFEST_ID } from './serialized.js';

const VIRTUAL_SERVER_ID = 'astro:config/server';
const RESOLVED_VIRTUAL_SERVER_ID = '\0' + VIRTUAL_SERVER_ID;
const VIRTUAL_CLIENT_ID = 'astro:config/client';
const RESOLVED_VIRTUAL_CLIENT_ID = '\0' + VIRTUAL_CLIENT_ID;

export default function virtualModulePlugin(): Plugin {
	return {
		name: 'astro-manifest-plugin',
		resolveId(id) {
			// Resolve the virtual module
			if (VIRTUAL_SERVER_ID === id) {
				return RESOLVED_VIRTUAL_SERVER_ID;
			} else if (VIRTUAL_CLIENT_ID === id) {
				return RESOLVED_VIRTUAL_CLIENT_ID;
			}
		},
		async load(id) {
			if (id === RESOLVED_VIRTUAL_CLIENT_ID) {
				// There's nothing wrong about using `/client` on the server
				const code = `
import { manifest } from '${SERIALIZED_MANIFEST_ID}'
const {  base, build, i18n, trailingSlash, site, compressHTML } = manifest;
export { base, build, i18n, trailingSlash, site, compressHTML };
				`;
				return { code };
			}
			// server
			else if (id == RESOLVED_VIRTUAL_SERVER_ID) {
				if (this.environment.name === 'client') {
					throw new AstroError({
						...AstroErrorData.ServerOnlyModule,
						message: AstroErrorData.ServerOnlyModule.message(VIRTUAL_SERVER_ID),
					});
				}
				const code = `
import { manifest } from '${SERIALIZED_MANIFEST_ID}'

const { build, cacheDir, outDir, publicDir, srcDir, root, base, i18n, trailingSlash, site, compressHTML } = manifest;; 
export { build, cacheDir, outDir, publicDir, srcDir, root, base, i18n, trailingSlash, site, compressHTML  }; 

				`;
				return { code };
			}
		},
	};
}
