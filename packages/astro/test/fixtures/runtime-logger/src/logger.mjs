// Records every message the runtime logger emits so `test/runtime-logger.test.ts`
// can assert what was routed through the configured destination. The built server
// bundle runs in the test process, so `globalThis` is shared with the test.
const messages = (globalThis.__astroRuntimeLoggerMessages ??= []);

export default function () {
	return {
		write(message) {
			messages.push(message);
		},
	};
}
