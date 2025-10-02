import { manifest as serializedManifest } from "astro:serialized-manifest";
import { renderers } from "astro:renderers";
import { routes } from "astro:routes"
import { createExports } from "@astrojs/cloudflare/entrypoints/server.js";

const actions = async () => {
	const actions = await import("astro-internal:actions");
	return actions
};
const manifest = Object.assign(serializedManifest, { renderers, actions });


export default createExports(manifest, routes).default
