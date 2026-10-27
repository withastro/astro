import { getRequestEvent } from '@solidjs/web';

export async function double(n) {
	'use server';
	return n * 2;
}

// Reads the Solid request event: on endpoint dispatch the injected route
// threads Astro's locals in; on direct SSR calls the renderer's
// provideRequestEvent scope supplies the same event.
export async function whoami() {
	'use server';
	const event = getRequestEvent();
	return String(event?.locals?.user ?? 'missing');
}
