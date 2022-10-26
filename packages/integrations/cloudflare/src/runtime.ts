export type WorkerRuntime<T = unknown> = {
	name: 'cloudflare';
	env: T;
	waitUntil(promise: Promise<any>): void;
	passThroughOnException(): void;
};

export type PagesRuntime<T = unknown, U = unknown> = {
	name: 'cloudflare';
	env: T;
	functionPath: string;
	params: Record<string, string>;
	data: U;
	waitUntil(promise: Promise<any>): void;
	next(request: Request): void;
};

export function getRuntime<T = unknown, U = unknown>(
	request: Request
): WorkerRuntime<T> | PagesRuntime<T, U> {
	if (!!request) {
		return Reflect.get(request, Symbol.for('runtime'));
	} else {
		throw new Error(
			'To retrieve the current cloudflare runtime you need to pass in the Astro request object'
		);
	}
}
