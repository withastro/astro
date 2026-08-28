import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
	const sessionAction = context.url.searchParams.get('session');
	if (sessionAction === 'read') {
		return new Response(String(await context.session?.get('redirect-session')));
	}
	if (sessionAction === 'write') {
		context.session?.set('redirect-session', 'endpoint');
		return new Response(null, {
			status: 308,
			headers: { location: '/target?source=session' },
		});
	}
	return new Response('This body is replaced.', {
		status: 308,
		headers: {
			location: '/target?source=endpoint',
			'x-original-header': 'preserved',
			'set-cookie': 'original=true; Path=/',
		},
	});
}
