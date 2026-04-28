import {
	type DevServer,
	type AstroInlineConfig,
	type Fixture,
	loadFixture as baseLoadFixture,
} from 'astro/_internal/test/test-utils';
import { AstroIntegrationLogger, type AstroLogMessage } from 'astro/_internal/logger';

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
