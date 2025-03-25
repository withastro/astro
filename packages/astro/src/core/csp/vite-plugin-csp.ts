import type {AstroPluginOptions} from "../../types/astro.js";
import type {Plugin as VitePlugin} from "vite";
import fs from "node:fs";

export const SERVER_ISLAND_SCRIPT_DEV = "/@astro-island-script-development"
export const RESOLVED_SERVER_ISLAND_SCRIPT_DEV = "\0" + SERVER_ISLAND_SCRIPT_DEV;
export const SERVER_ISLAND_SCRIPT_PROD = "/@astro:island-script"
export const RESOLVED_SERVER_ISLAND_SCRIPT_PROD = "\0" + SERVER_ISLAND_SCRIPT_PROD;

export const ASTRO_HASHES = "astro-internal:hashes";
export const RESOLVED_ASTRO_HASHES = "\0" + ASTRO_HASHES;

export function vitePluginCsp({ settings, logger }: AstroPluginOptions): VitePlugin {
	return {
		name: "@astro/plugin-csp",
		enforce: "pre",
		resolveId(id) {
			if (id === SERVER_ISLAND_SCRIPT_DEV) {
				return RESOLVED_SERVER_ISLAND_SCRIPT_DEV
			} else if (id === SERVER_ISLAND_SCRIPT_PROD) {
				return RESOLVED_SERVER_ISLAND_SCRIPT_PROD
			}
 		},
		async load(id) {
			if (id !== RESOLVED_SERVER_ISLAND_SCRIPT_DEV|| id !== RESOLVED_SERVER_ISLAND_SCRIPT_PROD) {
				return
			}
			
			
			if (id === RESOLVED_SERVER_ISLAND_SCRIPT_DEV) {
				let script = await import("astro/runtime/server/astro-island.prebuilt-dev.js").then(m => m.default);
				return script
			} else if (id === RESOLVED_SERVER_ISLAND_SCRIPT_PROD) {
				let script = await import("astro/runtime/server/astro-island.prebuilt.js").then(mod => mod.default);
				return script
			}
		}
	}
}

export function vitePluginScriptHashes({ settings, logger }: AstroPluginOptions): VitePlugin {
	return {
		name: "@astro/plugin-hashes",
		enforce: "pre",
		resolveId(id) {
			if (id === ASTRO_HASHES) {
				return RESOLVED_ASTRO_HASHES
			}
		},
		
		async load(id) {
			if (id === RESOLVED_ASTRO_HASHES) {
				const hashes = JSON.parse(await fs.promises.readFile("../../../../prebuilds.json", "utf-8"));
				const module = hashes.map((hash: unknown) => `'sha256-${hash}'`).join(" ");
				return "export const hashes = " + module;
			}
		}
	}
};
