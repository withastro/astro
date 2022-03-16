import fs from 'fs';
import lightcookie from 'lightcookie';

const dbJSON = fs.readFileSync(new URL('./db.json', import.meta.url));
const db = JSON.parse(dbJSON);
const products = db.products;
const productMap = new Map(products.map((product) => [product.id, product]));

// Normally this would be in a database.
const userCartItems = new Map();

const routes = [
	{
		match: /\/api\/products\/([0-9])+/,
		async handle(_req, res, [, idStr]) {
			const id = Number(idStr);
			if (productMap.has(id)) {
				const product = productMap.get(id);
				res.writeHead(200, {
					'Content-Type': 'application/json',
				});
				res.end(JSON.stringify(product));
			} else {
				res.writeHead(404, {
					'Content-Type': 'text/plain',
				});
				res.end('Not found');
			}
		},
	},
	{
		match: /\/api\/products/,
		async handle(_req, res) {
			res.writeHead(200, {
				'Content-Type': 'application/json',
			});
			res.end(JSON.stringify(products));
		},
	},
	{
		match: /\/api\/cart/,
		async handle(req, res) {
			res.writeHead(200, {
				'Content-Type': 'application/json'
			});
			let cookie = req.headers.cookie;
			let userId = cookie ? lightcookie.parse(cookie)['user-id'] : '1'; // default for testing
			if(!userId || !userCartItems.has(userId)) {
				res.end(JSON.stringify({ items: [] }));
				return;
			}
			let items = userCartItems.get(userId);
			let array = Array.from(items.values());
			res.end(JSON.stringify({ items: array }));
		}
	},
	{
		match: /\/api\/add-to-cart/,
		async handle(req, res) {
			let body = '';
			req.on('data', chunk => body += chunk);
			return new Promise(resolve => {
				req.on('end', () => {
					let cookie = req.headers.cookie;
					let userId = lightcookie.parse(cookie)['user-id'];
					let msg = JSON.parse(body);

					if(!userCartItems.has(userId)) {
						userCartItems.set(userId, new Map());
					}

					let cart = userCartItems.get(userId);
					if(cart.has(msg.id)) {
						cart.get(msg.id).count++;
					} else {
						cart.set(msg.id, { id: msg.id, name: msg.name, count: 1 });
					}

					res.writeHead(200, {
						'Content-Type': 'application/json',
					});
					res.end(JSON.stringify({ ok: true }));
				});
			});
		}
	}
];

export async function apiHandler(req, res) {
	for (const route of routes) {
		const match = route.match.exec(req.url);
		if (match) {
			return route.handle(req, res, match);
		}
	}
	res.writeHead(404, {
		'Content-Type': 'text/plain',
	});
	res.end('Not found');
}
