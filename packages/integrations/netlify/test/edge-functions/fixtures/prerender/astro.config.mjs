import { defineConfig } from "astro/config";
import { netlifyEdgeFunctions } from "@astrojs/netlify";

const isHybridMode = process.env.PRERENDER === "false";

/** @type {import('astro').AstroConfig} */
const partialConfig = {
  output: isHybridMode ? "hybrid" : "server",
};

export default defineConfig({
  adapter: netlifyEdgeFunctions({
    dist: new URL("./dist/", import.meta.url),
  }),
  ...partialConfig,
});
