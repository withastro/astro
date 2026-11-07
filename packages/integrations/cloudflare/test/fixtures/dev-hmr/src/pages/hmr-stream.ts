import type { APIRoute } from 'astro';
import React from 'react';

export const GET: APIRoute = ({ url }) => {
	const encoder = new TextEncoder();
	return new Response(new ReadableStream({
		async start(controller) {
			controller.enqueue(encoder.encode('prefix\n'));
			const gate = url.searchParams.get('gate');
			if (gate) await fetch(new URL(`/__hmr-gate/${gate}`, url));
			const { default: laterReact } = await import('react');
			controller.enqueue(encoder.encode(JSON.stringify({ same: React === laterReact })));
			controller.close();
		},
	}));
};
