import node from "@astrojs/node";
import astroDynamicStaticSplitDomain from "astro-dynamic-static-split-domain"
// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	adapter: node({
		mode: "standalone",
	}),
	integrations: [astroDynamicStaticSplitDomain(
		{
			serverIslandDynamicBase: "https://api.mysite.com",
		}
	)],
});
