import type { AstroLogger } from '../../core/logger/core.js';
import type { Flags } from '../flags.js';
import { devServerCommand, logs as serverLogs } from '../server.js';

export async function logs({
	flags,
	logger,
}: {
	flags: Flags;
	logger: AstroLogger;
}): Promise<void> {
	await serverLogs({ flags, logger, config: devServerCommand });
}
