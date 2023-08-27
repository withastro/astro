import type { Logger } from '../core/logger/core.js';
import * as msg from '../core/messages.js';

export function log404(logger: Logger, pathname: string) {
	logger.info('serve', msg.req({ url: pathname, statusCode: 404 }));
}
