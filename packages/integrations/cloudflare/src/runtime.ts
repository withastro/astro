export type WorkerRuntime<T> = {
	name: 'cloudflare';
	env: T;
	waitUntil(promise: Promise<any>): void;
	passThroughOnException(): void;
};

export type PagesRuntime<T, U> = {
	name: 'cloudflare';
	env: T;
	functionPath: string;
	params: Record<string, string>;
	data: U;
	waitUntil(promise: Promise<any>): void;
	next(request: Request): void;
};

export function getRuntime<T, U>(request: Request): WorkerRuntime<T> | PagesRuntime<T, U> {
	return Reflect.get(request, Symbol.for('runtime'));
}
