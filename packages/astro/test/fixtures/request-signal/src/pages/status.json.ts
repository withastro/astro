import type { APIContext } from 'astro';

declare global {
	// eslint-disable-next-line no-var
	var __requestAbortState: { aborted: boolean; events: string[] } | undefined;
}

export const GET = ({ request }: APIContext) => {
	const url = new URL(request.url);
	const shouldReset = url.searchParams.get('reset') === '1';
	const state = globalThis.__requestAbortState ?? { aborted: false, events: [] };

	if (shouldReset) {
		globalThis.__requestAbortState = { aborted: false, events: [] };
	}

	return new Response(JSON.stringify(state), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
		},
	});
};
