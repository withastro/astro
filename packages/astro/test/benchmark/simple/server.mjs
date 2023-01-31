import http from 'http';
import { handler } from './dist/server/entry.mjs';

const listener = (req, res) => {
	handler(req, res, (err) => {
		if (err) {
			res.writeHead(500);
			res.end(err.toString());
		} else {
			res.writeHead(404);
			res.end('Not found');
		}
	});
};

const server = http.createServer(listener);
server.listen(3002);
// eslint-disable-next-line no-console
console.log(`Listening at http://localhost:3002`);
