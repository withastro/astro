import './shim.js';
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';

export async function start(manifest: SSRManifest) {
	const app = new App(manifest);

	// Start listening on port 8080 of localhost.
	const server = Deno.listen({ port: 8085 });
	console.log(`HTTP webserver running.  Access it at:  http://127.0.0.1:8085/`);

	// Connections to the server will be yielded up as an async iterable.
	for await (const conn of server) {
		// In order to not be blocking, we need to handle each connection individually
		// without awaiting the function
		serveHttp(conn, app);
	}

}

async function render(request: Request, app: App) {
	const response = await app.render(request);
	console.log(response)
	return response;
}

async function serveHttp(conn: Deno.Conn, app: App) {
  // This "upgrades" a network connection into an HTTP connection.
  const httpConn = Deno.serveHttp(conn);
  // Each request sent over the HTTP connection will be yielded as an async
  // iterator from the HTTP connection.
  for await (const requestEvent of httpConn) {
		requestEvent.respondWith(render(requestEvent.request, app))
  }
}
