import type {AstroPluginOptions} from "../../types/astro.js";
import type {Plugin as VitePlugin} from "vite";

export const SERVER_ISLAND_SCRIPT_DEV = "astro:island-script-development"
export const RESOLVED_SERVER_ISLAND_SCRIPT_DEV = "\0" + SERVER_ISLAND_SCRIPT_DEV;
export const SERVER_ISLAND_SCRIPT_PROD = "astro:island-script"
export const RESOLVED_SERVER_ISLAND_SCRIPT_PROD = "\0" + SERVER_ISLAND_SCRIPT_PROD;

export function vitePluginCsp({ settings, logger }: AstroPluginOptions): VitePlugin {
	return {
		name: "astro:csp",
		enforce: "pre",
		resolveId(id) {
			if (id === SERVER_ISLAND_SCRIPT_DEV) {
				return RESOLVED_SERVER_ISLAND_SCRIPT_DEV
			} else if (id === SERVER_ISLAND_SCRIPT_PROD) {
				return RESOLVED_SERVER_ISLAND_SCRIPT_PROD
			}
 		},
		async load(id) {
			if (id === RESOLVED_SERVER_ISLAND_SCRIPT_DEV) {
				let script = await import("astro/runtime/server/astro-island.prebuilt-dev.js")
				return script
			} else if (id === RESOLVED_SERVER_ISLAND_SCRIPT_PROD) {
				let script = await import("astro/runtime/server/astro-island.prebuilt.js")
				return script
			}
		}
	}
}
