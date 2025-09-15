import { manifest as serializedManifest } from "astro:serialized-manifest";
import { renderers } from "astro:renderers";
import { routes } from "astro:routes"
import { createExports } from "@astrojs/cloudflare/entrypoints/server.js";

const manifest = Object.assign(serializedManifest, { renderers });

export default createExports(manifest, routes).default
