import type { AstroLogger } from '../../core/logger/core.js';
import type { Flags } from '../flags.js';
import {
	devServerCommand,
	formatStopOutput,
	stop as stopServer,
	type StopResult,
} from '../server.js';

export { formatStopOutput, type StopResult };

export async function stop({
	flags,
	logger,
}: {
	flags: Flags;
	logger: AstroLogger;
}): Promise<void> {
	await stopServer({ flags, logger, config: devServerCommand });
}
