/// <reference types="astro/client" />
declare namespace App {
	interface Locals {
    foo?: string;
		user: {
			name: string;
			surname: string;
		};
	}
}
