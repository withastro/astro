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

async function getJson<T>(incomingReq: Request, endpoint: string): Promise<T> {
	const origin = new URL(incomingReq.url).origin;
	try {
		const response = await fetch(`${origin}${endpoint}`, {
			credentials: 'same-origin',
			headers: incomingReq.headers,
		});
		if (!response.ok) {
			throw new Error(`GET ${endpoint} failed: ${response.statusText}`);
		}
		return response.json() as Promise<T>;
	} catch (error) {
		if (error instanceof DOMException || error instanceof TypeError) {
			throw new Error(`GET ${endpoint} failed: ${error.message}`);
		}
		throw error;
	}
}

export async function getProducts(incomingReq: Request): Promise<Product[]> {
	return getJson<Product[]>(incomingReq, '/api/products');
}

export async function getProduct(incomingReq: Request, id: number): Promise<Product> {
	return getJson<Product>(incomingReq, `/api/products/${id}`);
}

export async function getUser(incomingReq: Request): Promise<User> {
	return getJson<User>(incomingReq, `/api/user`);
}

export async function getCart(incomingReq: Request): Promise<Cart> {
	return getJson<Cart>(incomingReq, `/api/cart`);
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
