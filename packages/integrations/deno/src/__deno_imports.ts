// This file is a shim for any Deno-specific imports!
// It will be replaced in the final Deno build.
//
// This allows us to prerender pages in Node.
export class Server {
	listenAndServe() {}
}

export function serveFile() {}
export function fromFileUrl() {}
