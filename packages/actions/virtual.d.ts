declare namespace App {
	interface Locals {
		getActionResult: <T extends (...args: any) => any>(
			action: T
		) => Awaited<ReturnType<T>> | undefined;
	}
}
