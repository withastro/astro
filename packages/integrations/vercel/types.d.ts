import { waitUntil } from '@vercel/functions';

export interface EdgeLocals {
	vercel: {
		edge: {
			waitUntil: typeof waitUntil;
		};
	};
}
