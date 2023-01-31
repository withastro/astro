import handler from './.netlify/edge-functions/entry.js';
import { Server } from 'https://deno.land/std@0.132.0/http/server.ts';

const _server = new Server({
	port: 8085,
	hostname: '0.0.0.0',
	handler,
});

_server.listenAndServe();
console.error(`Server running on port 8085`);
