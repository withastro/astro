import { manifest } from "astro:serialized-manifest";
import { createExports } from "./worker";

export default createExports(manifest).default
