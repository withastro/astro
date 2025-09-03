import { manifest } from "astro:ssr-manifest";
import { createExports } from "./worker";

export default createExports(manifest).default
