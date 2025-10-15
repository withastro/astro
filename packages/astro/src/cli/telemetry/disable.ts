import type { Logger } from '../../core/logger/core.js';
import * as msg from '../../core/messages.js';
import { telemetry } from '../../events/index.js';

export function disable({ logger }: { logger: Logger }) {
	telemetry.setEnabled(false);
	logger.info('SKIP_FORMAT', msg.telemetryDisabled());
}
