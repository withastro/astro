export function logCall<This, Args extends unknown[], Return>(
	originalMethod: (this: This, ...args: Args) => Return,
	context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) {
	return function (this: This, ...args: Args): Return {
		console.log(`Calling ${String(context.name)}`);
		return originalMethod.call(this, ...args);
	};
}
