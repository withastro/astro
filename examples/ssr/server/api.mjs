import fs from 'fs';
const dbJSON = fs.readFileSync(new URL('./db.json', import.meta.url));
const db = JSON.parse(dbJSON);
const products = db.products;
const productMap = new Map(products.map(product => [product.id, product]));

const routes = [
	{
		match: /\/api\/products\/([0-9])+/,
		async handle(_req, res, [,idStr]) {
			const id = Number(idStr);
			if(productMap.has(id)) {
				const product = productMap.get(id);
				res.writeHead(200, {
					'Content-Type': 'application/json'
				});
				res.end(JSON.stringify(product));
			} else {
				res.writeHead(404, {
					'Content-Type': 'text/plain'
				});
				res.end('Not found');
			}
		}
	},
	{
		match: /\/api\/products/,
		async handle(_req, res) {
			res.writeHead(200, {
				'Content-Type': 'application/json',
			});
			res.end(JSON.stringify(products));
		}
	}

]

export async function apiHandler(req, res) {
	for(const route of routes) {
		const match = route.match.exec(req.url);
		if(match) {
			return route.handle(req, res, match);
		}
	}
	res.writeHead(404, {
		'Content-Type': 'text/plain'
	});
	res.end('Not found');
}
