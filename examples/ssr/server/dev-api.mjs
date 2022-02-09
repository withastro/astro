import { createServer } from 'http';
import { apiHandler } from './api.mjs';

const PORT = process.env.PORT || 8085;

const server = createServer((req, res) => {
	apiHandler(req, res).catch(err => {
		console.error(err);
		res.writeHead(500, {
			'Content-Type': 'text/plain'
		});
		res.end(err.toString());
	})
});

server.listen(PORT);
console.log(`API running at http://localhost:${PORT}`);
