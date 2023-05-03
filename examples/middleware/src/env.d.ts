/// <reference types="astro/client" />
declare global {
	namespace AstroMiddleware {
		interface Locals {
			user: {
				name: string;
				surname: string;
			};
		}
	}
}

export {};
