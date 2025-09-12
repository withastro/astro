import logger from 'astro:otel:logger';
import meter from 'astro:otel:meter';
import tracer from 'astro:otel:tracer';

export interface Product {
	id: number;
	name: string;
	price: number;
	image: string;
}

interface User {
	id: number;
}

interface Cart {
	items: Array<{
		id: number;
		name: string;
		count: number;
	}>;
}

const readCounter = meter.createCounter('api.reads');

async function getJson<T>(incomingReq: Request, endpoint: string): Promise<T> {
	readCounter.add(1, { endpoint });

	const origin = new URL(incomingReq.url).origin;
	try {
		const response = await fetch(`${origin}${endpoint}`, {
			credentials: 'same-origin',
			headers: incomingReq.headers,
		});
		if (!response.ok) {
			throw new Error(`GET ${endpoint} failed: ${response.statusText}`);
		}
		return (await response.json()) as Promise<T>;
	} catch (error) {
		if (error instanceof DOMException || error instanceof TypeError) {
			throw new Error(`GET ${endpoint} failed: ${error.message}`);
		}
		logger.emit({
			severityText: 'error',
			eventName: 'api.error',
			body: {
				message: `GET ${endpoint} failed: ${error instanceof Error ? error.message : String(error)}`,
				endpoint,
				stack: error instanceof Error ? error.stack : undefined,
			},
		});
		throw error;
	}
}

export function getProducts(incomingReq: Request): Promise<Product[]> {
	return tracer.startActiveSpan('getProducts', () =>
		getJson<Product[]>(incomingReq, '/api/products'),
	);
}

export function getProduct(incomingReq: Request, id: number): Promise<Product> {
	return tracer.startActiveSpan('getProduct', () =>
		getJson<Product>(incomingReq, `/api/products/${id}`),
	);
}

export function getUser(incomingReq: Request): Promise<User> {
	return tracer.startActiveSpan('getUser', () => getJson<User>(incomingReq, `/api/user`));
}

export function getCart(incomingReq: Request): Promise<Cart> {
	return tracer.startActiveSpan('getCart', () => getJson<Cart>(incomingReq, `/api/cart`));
}

export async function addToUserCart(id: number | string, name: string): Promise<void> {
	await fetch(`${location.origin}/api/cart`, {
		credentials: 'same-origin',
		method: 'POST',
		mode: 'no-cors',
		headers: {
			'Content-Type': 'application/json',
			Cache: 'no-cache',
		},
		body: JSON.stringify({
			id,
			name,
		}),
	});
}
