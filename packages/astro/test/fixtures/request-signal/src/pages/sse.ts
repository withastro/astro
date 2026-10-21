import type { APIContext } from 'astro';

const encoder = new TextEncoder();

declare global {
	// eslint-disable-next-line no-var
	var __requestAbortState: { aborted: boolean; events: string[] } | undefined;
}

export const GET = ({ request }: APIContext) => {
	globalThis.__requestAbortState = { aborted: false, events: ['started'] };

	let heartbeat: ReturnType<typeof setInterval> | undefined;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const enqueue = (payload: string) => {
				controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
			};

			enqueue('ready');

			heartbeat = setInterval(() => enqueue('ping'), 1000);

			const onAbort = () => {
				if (heartbeat) clearInterval(heartbeat);
				globalThis.__requestAbortState = {
					aborted: true,
					events: [...(globalThis.__requestAbortState?.events ?? []), 'aborted'],
				};
				controller.close();
			};

			if (request.signal.aborted) {
				onAbort();
				return;
			}

			request.signal.addEventListener('abort', onAbort, { once: true });
		},
		cancel() {
			if (heartbeat) clearInterval(heartbeat);
		},
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream; charset=utf-8',
			'cache-control': 'no-cache, no-transform',
			connection: 'keep-alive',
		},
	});
};
