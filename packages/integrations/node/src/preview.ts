import http from 'http';
import fs from 'fs';

export default async function preview({
	outDir,
	host,
	port,
}: {
	outDir: string;
	host: string;
	port: number;
}) {
	const ssrHandler = (await import(new URL('server/entry.mjs', outDir).toString())).handler;
	const httpServer = http
		.createServer(function (req, res) {
			fs.readFile(new URL('client' + req.url, outDir), function (err, data) {
				// Static asset found! Serve that directly.
				if (!err) {
					res.writeHead(200);
					res.end(data);
					return;
				}
				// Otherwise, request the page from our server application.
				ssrHandler(req, res, (err: any) => {
					if (err) {
						res.writeHead(500);
						res.end(err.toString());
					} else {
						res.writeHead(404);
						res.end();
					}
				});
			});
		})
		.listen(port, host);

	// Resolves once the server is closed
	function closed() {
		return new Promise<void>((resolve, reject) => {
			httpServer!.addListener('close', resolve);
			httpServer!.addListener('error', reject);
		});
	}

	console.log(`Preview server listening on http://${host}:${port}`);
	return {
		host,
		port,
		closed,
		server: httpServer!,
		stop: async () => {
			await new Promise((resolve, reject) => {
				httpServer.close((err) => (err ? reject(err) : resolve(undefined)));
			});
		},
	};
}
