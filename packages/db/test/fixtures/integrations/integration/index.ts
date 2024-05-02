import {} from "astro"
import { defineIntegration } from "astro/integration"
import type { AstroDbHooks } from "@astrojs/db/types"

declare module "astro" {
	interface AstroIntegrationHooks extends AstroDbHooks {}
}

export default defineIntegration({
	name: "db-test-integration",
	setup() {
		return {
					hooks: {
			'astro:db:setup': ({ extendDb }) => {
				extendDb({
					configEntrypoint: './integration/config.ts',
					seedEntrypoint: './integration/seed.ts',
				});
			},
		},
		}
	}
})
