import {
	type DevServer,
	type AstroInlineConfig,
	type Fixture,
	loadFixture as baseLoadFixture,
} from '../../../astro/test/test-utils.js';

export { SpyLogger } from '../../../astro/test/units/test-utils.js';
export type { AstroInlineConfig, DevServer, Fixture };

export function loadFixture(config: AstroInlineConfig) {
	return baseLoadFixture(config);
}
