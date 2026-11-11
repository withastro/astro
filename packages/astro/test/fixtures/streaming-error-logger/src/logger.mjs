// Records every message the logger emits so `test/streaming-error-logger.test.ts`
// can count them. The dev server runs in the test process, so `globalThis` is shared.
const messages = (globalThis.__astroStreamingErrorLoggerMessages ??= []);

export default function () {
	return {
		write(message) {
			messages.push(message);
		},
	};
}
