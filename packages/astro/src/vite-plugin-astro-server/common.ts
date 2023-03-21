import { info, type LogOptions } from '../core/logger/core.js';
import * as msg from '../core/messages.js';

export function log404(logging: LogOptions, pathname: string) {
	info(logging, 'serve', msg.req({ url: pathname, statusCode: 404 }));
}
