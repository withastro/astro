import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  adapter: cloudflare(),
  output: 'static',
  redirects: {
		"/redirect": '/page2'
  },
});
