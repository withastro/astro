import node from "@astrojs/node";
// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	adapter: node({
		mode: "standalone",
	}),
	serverIslandDynamicBase: "https://api.mysite.com",
});
