import { manifest } from "astro:serialized-manifest";
import { routes } from "astro:routes"
import { createExports } from "./worker";

export default createExports(manifest, routes).default
