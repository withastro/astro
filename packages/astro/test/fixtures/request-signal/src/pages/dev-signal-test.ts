import type { APIContext } from 'astro';

export const prerender = false;

export const GET = async ({ request, url }: APIContext) => {
	const timeoutMs = Number(url.searchParams.get('timeout') ?? 5000);

	// Wait until the signal is aborted or 5 seconds pass
	const aborted = await new Promise<boolean>((resolve) => {
		if (request.signal.aborted) {
			resolve(true);
			return;
		}
		const timeout = setTimeout(() => resolve(false), timeoutMs);
		request.signal.addEventListener(
			'abort',
			() => {
				clearTimeout(timeout);
				resolve(true);
			},
			{ once: true },
		);
	});

	return new Response(JSON.stringify({ aborted }), {
		headers: { 'content-type': 'application/json' },
	});
};
