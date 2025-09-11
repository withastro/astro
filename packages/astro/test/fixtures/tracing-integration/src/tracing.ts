import { onTraceEvent } from 'astro/runtime/server/tracing.js';

onTraceEvent((event) => {
	const events = globalThis[Symbol.for('astro.tracing.test')];
	if (Array.isArray(events)) {
		events.push(event);
	} else {
		process.stderr.write('No global tracing array found');
	}
});
