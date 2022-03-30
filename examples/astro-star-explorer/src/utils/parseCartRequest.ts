import querystring from 'querystring';

export type ATCParams = {
	productName: string;
	quantity: number;
	size: string;
};

export default async function parseCartRequest(request: Request): Promise<ATCParams> {
	'quanity=1&alkdfj=sdlkf';
	// TODO: use URL search params
	const data = querystring.decode(await request.text());
	console.log(data);

	if (typeof data?.productName !== 'string' || typeof data?.quantity !== 'string' || typeof data?.size !== 'string') {
		throw new Error('One of the required checkout fields was missing.');
	}

	const quantity = parseInt(data.quantity);
	if (Number.isNaN(quantity)) {
		throw new Error('Quantity must be a valid integer.');
	}

	return {
		quantity,
		productName: data.productName,
		size: data.size,
	};
}
