export {};

declare global {
	namespace App {
		interface Locals {
			utils: import('./utilClass').Utils;
		}
	}
}
