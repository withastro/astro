import {
	type DevServer,
	type AstroInlineConfig,
	type Fixture,
	loadFixture as baseLoadFixture,
} from '../../../astro/test/test-utils.ts';

export { SpyLogger } from 'astro/_internal/test/units/test-utils';

export type { AstroInlineConfig, DevServer, Fixture };

export function loadFixture(config: AstroInlineConfig) {
	return baseLoadFixture(config);
}
