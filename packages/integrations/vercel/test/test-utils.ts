import {
	loadFixture as baseLoadFixture,
	type Fixture,
	type DevServer,
	type AstroInlineConfig,
} from '../../../astro/test/test-utils.js';

export type { Fixture, DevServer, AstroInlineConfig };

export function loadFixture(config: AstroInlineConfig) {
	if (config?.root) {
		config.root = new URL(config.root as string, import.meta.url).toString();
	}
	return baseLoadFixture(config);
}
