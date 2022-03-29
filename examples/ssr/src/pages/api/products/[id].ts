import { productMap } from '../../../models/db';

export function get({ id: idStr }) {
	const id = Number(idStr);
	if (productMap.has(id)) {
		const product = productMap.get(id);

		return {
			body: JSON.stringify(product)
		};
	} else {
		return new Response(null, {
			status: 400,
			statusText: 'Not found'
		});
	}
}
