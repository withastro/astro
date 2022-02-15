interface Product {
	id: number;
	name: string;
	price: number;
	image: string;
}

//let origin: string;
const { mode } = import.meta.env;
const origin = mode === 'develeopment' ? `http://localhost:3000` : `http://localhost:8085`;

async function get<T>(endpoint: string, cb: (response: Response) => Promise<T>): Promise<T> {
	const response = await fetch(`${origin}${endpoint}`);
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
