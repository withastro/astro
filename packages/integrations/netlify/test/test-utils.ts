import {
	type DevServer,
	type AstroInlineConfig,
	type Fixture,
	loadFixture as baseLoadFixture,
} from '../../../astro/test/test-utils.js';
import {
	AstroIntegrationLogger,
	type AstroLogMessage,
} from '../../../astro/dist/core/logger/core.js';

export type { AstroInlineConfig, DevServer, Fixture };

export function loadFixture(config: AstroInlineConfig) {
	return baseLoadFixture(config);
}

export class SpyIntegrationLogger extends AstroIntegrationLogger {
	readonly messages: AstroLogMessage[];

	constructor() {
		const messages: AstroLogMessage[] = [];
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
