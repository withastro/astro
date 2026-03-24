import type { Plugin } from 'vite';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { SERIALIZED_MANIFEST_ID } from './serialized.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import { fromRoutingStrategy, toFallbackType, toRoutingStrategy } from '../core/app/common.js';
import type { AstroSettings } from '../types/astro.js';

const VIRTUAL_SERVER_ID = 'astro:config/server';
const RESOLVED_VIRTUAL_SERVER_ID = '\0' + VIRTUAL_SERVER_ID;
const VIRTUAL_CLIENT_ID = 'astro:config/client';
const RESOLVED_VIRTUAL_CLIENT_ID = '\0' + VIRTUAL_CLIENT_ID;

export default function virtualModulePlugin({ settings }: { settings: AstroSettings }): Plugin {
	// Pre-compute the client config values from settings so that astro:config/client
	// doesn't need to import from virtual:astro:manifest (which pulls in server-only
	// virtual modules like virtual:astro:routes and virtual:astro:pages that are
	// restricted to server environments via applyToEnvironment).
	const config = settings.config;

	let i18nCode = 'const i18n = undefined;';
	if (config.i18n) {
		// Apply the same toRoutingStrategy → fromRoutingStrategy roundtrip that the
		// serialized manifest uses, to ensure consistent routing config values.
		const strategy = toRoutingStrategy(config.i18n.routing, config.i18n.domains);
		const fallbackType = toFallbackType(config.i18n.routing);
		const routing = fromRoutingStrategy(strategy, fallbackType);
		i18nCode = `const i18n = {
  defaultLocale: ${JSON.stringify(config.i18n.defaultLocale)},
  locales: ${JSON.stringify(config.i18n.locales)},
  routing: ${JSON.stringify(routing)},
  fallback: ${JSON.stringify(config.i18n.fallback)}
};`;
	}

	let imageCode = 'const image = undefined;';
	if (config.image) {
		imageCode = `const image = {
  objectFit: ${JSON.stringify(config.image.objectFit)},
  objectPosition: ${JSON.stringify(config.image.objectPosition)},
  layout: ${JSON.stringify(config.image.layout)},
};`;
	}

	const clientConfigCode = `
${i18nCode}
${imageCode}
const base = ${JSON.stringify(config.base)};
const trailingSlash = ${JSON.stringify(config.trailingSlash)};
const site = ${JSON.stringify(config.site)};
const compressHTML = ${JSON.stringify(config.compressHTML)};
const build = {
  format: ${JSON.stringify(config.build.format)},
};

export { base, i18n, trailingSlash, site, compressHTML, build, image };
`;

	return {
		name: 'astro-manifest-plugin',
		resolveId: {
			filter: {
				id: new RegExp(`^(${VIRTUAL_SERVER_ID}|${VIRTUAL_CLIENT_ID})$`),
			},
			handler(id) {
				if (id === VIRTUAL_SERVER_ID) {
					return RESOLVED_VIRTUAL_SERVER_ID;
				}
				if (id === VIRTUAL_CLIENT_ID) {
					return RESOLVED_VIRTUAL_CLIENT_ID;
				}
			},
		},
		load: {
			filter: {
				id: new RegExp(`^(${RESOLVED_VIRTUAL_SERVER_ID}|${RESOLVED_VIRTUAL_CLIENT_ID})$`),
			},
			handler(id) {
				if (id === RESOLVED_VIRTUAL_CLIENT_ID) {
					// astro:config/client inlines values directly from settings instead of
					// importing from virtual:astro:manifest to avoid pulling server-only
					// virtual modules (virtual:astro:routes, virtual:astro:pages) into the
					// client environment where they are not available.
					return { code: clientConfigCode };
				}
				if (id === RESOLVED_VIRTUAL_SERVER_ID) {
					if (this.environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client) {
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
   domains: manifest.i18n.domains,
 };
}

let image = undefined;
if (manifest.image) {
  image = {
    objectFit: manifest.image.objectFit,
    objectPosition: manifest.image.objectPosition,
    layout: manifest.image.layout,
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
const root = new URL(manifest.rootDir);
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
 image,
}; 

				`;
					return { code };
				}
			},
		},
	};
}
