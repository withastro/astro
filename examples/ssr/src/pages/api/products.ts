import { products } from '../../models/db';

export function get() {
	return {
		body: JSON.stringify(products)
	};
}
