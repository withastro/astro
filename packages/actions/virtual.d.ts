declare namespace App {
	interface Locals {
		getActionResult: <T extends (...args: any) => any>(
			action: T
		) => Promise<Awaited<ReturnType<T>> | undefined>;
	}
}
