import type { AstroLogger } from '../../core/logger/core.js';
import type { Flags } from '../flags.js';
import {
	devServerCommand,
	formatStatusOutput,
	status as serverStatus,
	type StatusResult,
} from '../server.js';

export { formatStatusOutput, type StatusResult };

export async function status({
	flags,
	logger,
}: {
	flags: Flags;
	logger: AstroLogger;
}): Promise<void> {
	await serverStatus({ flags, logger, config: devServerCommand });
}
