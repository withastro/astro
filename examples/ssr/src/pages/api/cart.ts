import lightcookie from 'lightcookie';
import { userCartItems } from '../../models/session';

export function get(_params: any, request: Request) {
	let cookie = request.headers.get('cookie');
	let userId = cookie ? lightcookie.parse(cookie)['user-id'] : '1'; // default for testing
	if (!userId || !userCartItems.has(userId)) {
		return {
			body: JSON.stringify({ items: [] })
		};
	}
	let items = userCartItems.get(userId);
	let array = Array.from(items.values());

	return {
		body: JSON.stringify({ items: array })
	}
}

interface AddToCartItem {
	id: number;
	name: string;
}

export async function post(_params: any, request: Request) {
	const item: AddToCartItem = await request.json();

	let cookie = request.headers.get('cookie');
	let userId = lightcookie.parse(cookie)['user-id'];

	if (!userCartItems.has(userId)) {
		userCartItems.set(userId, new Map());
	}

	let cart = userCartItems.get(userId);
	if (cart.has(item.id)) {
		cart.get(item.id).count++;
	} else {
		cart.set(item.id, { id: item.id, name: item.name, count: 1 });
	}

	return {
		body: JSON.stringify({
			ok: true
		})
	};
}
