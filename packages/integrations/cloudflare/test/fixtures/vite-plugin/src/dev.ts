import { manifest } from "astro:serialized-manifest";
import { routes } from "astro:routes"
import { createExports } from "@astrojs/cloudflare/entrypoints/server.js";

export default createExports(manifest, routes).default
