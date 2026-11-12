import type { AstroLogger } from '../../core/logger/core.js';
import type { Flags } from '../flags.js';
import type { LockFileData } from '../../core/dev/lockfile.js';
import {
	background as startBackgroundServer,
	devServerCommand,
	formatBackgroundOutput,
	formatServerRunningMessage as formatServerMessage,
	type BackgroundErrorResult,
	type BackgroundResult,
} from '../server.js';

export { formatBackgroundOutput, type BackgroundErrorResult, type BackgroundResult };

export function formatServerRunningMessage(
	data: LockFileData,
	{ existing = false }: { existing?: boolean } = {},
): string {
	return formatServerMessage(data, devServerCommand, { existing });
}

export async function background({
	flags,
	logger,
}: {
	flags: Flags;
	logger: AstroLogger;
}): Promise<void> {
	await startBackgroundServer({ flags, logger, config: devServerCommand });
}
