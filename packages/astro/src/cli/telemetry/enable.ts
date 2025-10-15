import type { Logger } from '../../core/logger/core.js';
import * as msg from '../../core/messages.js';
import { telemetry } from '../../events/index.js';

export function enable({ logger }: { logger: Logger }) {
	telemetry.setEnabled(true);
	logger.info('SKIP_FORMAT', msg.telemetryEnabled());
}
