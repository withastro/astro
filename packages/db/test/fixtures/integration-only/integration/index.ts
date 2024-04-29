import type { AstroIntegration } from "astro"
import type { AstroDbHooks } from "@astrojs/db/types"

declare module "astro" {
	interface AstroIntegrationHooks extends AstroDbHooks {}
}

export default function testIntegration(): AstroIntegration {
	return {
		name: 'db-test-integration',
		hooks: {
			'astro:db:setup': ({ extendDb }) => {
				extendDb({
					configEntrypoint: './integration/config.ts',
					seedEntrypoint: './integration/seed.ts',
				});
			},
		},
	};
}
