import {
	type DevServer,
	type AstroInlineConfig,
	type Fixture,
	loadFixture as baseLoadFixture,
} from '../../../astro/test/test-utils.js';
import {
	AstroIntegrationLogger,
	type AstroLoggerMessage,
} from '../../../astro/dist/core/logger/core.js';

export type { AstroInlineConfig, DevServer, Fixture };

export function loadFixture(config: AstroInlineConfig) {
	return baseLoadFixture(config);
}

export class SpyIntegrationLogger extends AstroIntegrationLogger {
	readonly messages: AstroLoggerMessage[];

	constructor() {
		const messages: AstroLoggerMessage[] = [];
		super(
			{
				destination: {
					write(chunk): boolean {
						messages.push(chunk);
						return true;
					},
				},
				level: 'warn',
			},
			'test-spy',
		);
		this.messages = messages;
	}
}
