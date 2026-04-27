import {
	type DevServer,
	type AstroInlineConfig,
	type Fixture,
	loadFixture as baseLoadFixture,
} from '../../../astro/test/test-utils.js';

export { SpyLogger, type LogEntry } from '../../../astro/test/units/test-utils.ts';
export type { AstroInlineConfig, DevServer, Fixture };

export function loadFixture(config: AstroInlineConfig) {
	return baseLoadFixture(config);
}
