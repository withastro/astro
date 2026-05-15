import type { AstroLogger } from '../../core/logger/core.js';
import type { AstroVersionProvider, HelpDisplay, TextStyler } from '../definitions.js';
import type { HelpPayload } from '../domain/help-payload.js';
import type { Flags } from '../flags.js';
export declare class LoggerHelpDisplay implements HelpDisplay {
	#private;
	constructor({
		logger,
		textStyler,
		astroVersionProvider,
		flags,
	}: {
		logger: AstroLogger;
		textStyler: TextStyler;
		astroVersionProvider: AstroVersionProvider;
		flags: Flags;
	});
	shouldFire(): boolean;
	show({ commandName, description, headline, tables, usage }: HelpPayload): void;
}
