import { defineConfig } from "astro/config"
import cf from "@astrojs/cloudflare"

export default defineConfig({
	adapter: cf(),
	build: {
		serverEntry: 'custom.mjs',
	}
})
