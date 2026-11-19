export async function GET() {
	// Fire an unhandled rejection while still inside the request AsyncLocalStorage
	// context so the shared listener can attribute it to this URL.
	queueMicrotask(() => {
		Promise.reject(new Error('shared-listener-boom'));
	});
	await new Promise((resolve) => setTimeout(resolve, 100));
	return new Response('ok');
}
