import type { Logger } from '../../core/logger/core.js';
import * as msg from '../../core/messages.js';
import { telemetry } from '../../events/index.js';

export function reset({ logger }: { logger: Logger }) {
	telemetry.clear();
	logger.info('SKIP_FORMAT', msg.telemetryReset());
}
