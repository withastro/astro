interface Product {
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

const { MODE } = import.meta.env;
const origin = MODE === 'development' ? `http://127.0.0.1:3000` : `http://127.0.0.1:8085`;

async function get<T>(endpoint: string, cb: (response: Response) => Promise<T>): Promise<T> {
	const response = await fetch(`${origin}${endpoint}`, {
		credentials: 'same-origin'
	});
	if (!response.ok) {
		// TODO make this better...
		return null;
	}
	return cb(response);
}

export async function getProducts(): Promise<Product[]> {
	return get<Product[]>('/api/products', async (response) => {
		const products: Product[] = await response.json();
		return products;
	});
}

export async function getProduct(id: number): Promise<Product> {
	return get<Product>(`/api/products/${id}`, async (response) => {
		const product: Product = await response.json();
		return product;
	});
}

export async function getUser(): Promise<User> {
	return get<User>(`/api/user`, async response => {
		const user: User = await response.json();
		return user;
	});
}

export async function getCart(): Promise<Cart> {
	return get<Cart>(`/api/cart`, async response => {
		const cart: Cart = await response.json();
		return cart;
	});
}

export async function addToUserCart(id: number | string, name: string): Promise<void> {
	await fetch(`${origin}/api/add-to-cart`, {
		credentials: 'same-origin',
		method: 'POST',
		mode: 'no-cors',
		headers: {
			'Content-Type': 'application/json',
			'Cache': 'no-cache'
		},
		body: JSON.stringify({
			id,
			name
		})
	});
}
