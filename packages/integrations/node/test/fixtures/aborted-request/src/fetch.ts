export default {
	async fetch(request: Request) {
		const { pathname } = new URL(request.url);
		if (pathname === '/rejection') {
			return new Response(
				new ReadableStream(
					{
						pull(controller) {
							Reflect.set(
								globalThis,
								'__astroTestRejection',
								Promise.reject(new Error('intentional rejection')),
							);
							controller.enqueue(new TextEncoder().encode('ok'));
							controller.close();
						},
					},
					{ highWaterMark: 0 },
				),
			);
		}
		if (pathname === '/throw') throw new Error('intentional throw');
		if (request.method === 'POST') {
			// The abort test waits for this marker before destroying the socket so
			// it knows the server started reading the body.
			console.error('reading-json-body');
			await request.json();
		}
		return new Response('ok');
	},
};