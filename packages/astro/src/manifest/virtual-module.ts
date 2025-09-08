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
import { fromRoutingStrategy } from 'astro/app';

let i18n = undefined;
if (manifest.i18n) {
i18n = {
  defaultLocale: manifest.i18n.defaultLocale,
  locales: manifest.i18n.locales,
  routing: fromRoutingStrategy(manifest.i18n.strategy, manifest.i18n.fallbackType),
  fallback: manifest.i18n.fallback,
  };
}

const base = manifest.base;
const trailingSlash = manifest.trailingSlash;
const site = manifest.site;
const compressHTML = manifest.compressHTML;
const build = {
  format: manifest.buildFormat,
};

export { base, i18n, trailingSlash, site, compressHTML, build };
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
import { fromRoutingStrategy } from "astro/app";

let i18n = undefined;
if (manifest.i18n) {
 i18n = {
   defaultLocale: manifest.i18n.defaultLocale,
   locales: manifest.i18n.locales,
   routing: fromRoutingStrategy(manifest.i18n.strategy, manifest.i18n.fallbackType),
   fallback: manifest.i18n.fallback,
 };
}

const base = manifest.base;
const build = {
  server: new URL(manifest.buildServerDir),
  client: new URL(manifest.buildClientDir),
  format: manifest.buildFormat,
};

const cacheDir = new URL(manifest.cacheDir);
const outDir = new URL(manifest.outDir);
const publicDir = new URL(manifest.publicDir);
const srcDir = new URL(manifest.srcDir);
const root = new URL(manifest.hrefRoot);
const trailingSlash = manifest.trailingSlash;
const site = manifest.site;
const compressHTML = manifest.compressHTML;

export {
 base,
 build,
 cacheDir,
 outDir,
 publicDir,
 srcDir,
 root,
 trailingSlash,
 site,
 compressHTML,
 i18n,
}; 

				`;
				return { code };
			}
		},
	};
}
