export async function register() {
	await new Promise((resolve) => setTimeout(resolve, 0));
	throw new Error('Instrumentation registration failed');
}
