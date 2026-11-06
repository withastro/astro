import type { APIContext } from 'astro';

const encoder = new TextEncoder();

declare global {
	// eslint-disable-next-line no-var
	var __requestAbortState: { aborted: boolean; events: string[] } | undefined;
}

export const GET = ({ request }: APIContext) => {
	globalThis.__requestAbortState = { aborted: false, events: ['started'] };

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const onAbort = () => {
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
			controller.enqueue(encoder.encode('ready'));
		},
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
		},
	});
};
