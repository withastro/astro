import * as msg from '../../core/messages.js';
import { telemetry } from '../../events/index.js';

export async function notify() {
	await telemetry.notify(() => {
		console.log(msg.telemetryNotice() + '\n');
		return true;
	});
}
