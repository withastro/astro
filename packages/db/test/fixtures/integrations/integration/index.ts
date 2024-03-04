import type { AstroIntegration } from 'astro';

export default function testIntegration(): AstroIntegration {
	return {
		name: 'db-test-integration',
		hooks: {
			'astro:db:setup'({ extendDb }) {
				extendDb({
					configEntrypoint: './integration/config.ts',
					seedEntrypoint: './integration/seed.ts',
				});
			},
		},
	};
}
