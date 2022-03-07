export const any = {
	async any <T>(
		iterable: Iterable<T | PromiseLike<T>>
	): Promise<T> {
		return Promise.all(
			[...iterable].map(promise => {
				return new Promise((resolve, reject) =>
					Promise.resolve(promise).then(reject, resolve)
				)
			})
		).then(
			errors => Promise.reject(errors),
			value => Promise.resolve<T>(value)
		)
	}
}.any

export const initPromise = (target: any, exclude: Set<string>) => {
	if (exclude.has('Promise') || exclude.has('any')) return

	const Class = target.Promise || globalThis.Promise

	if (!Class.any) Object.defineProperty(Class, 'any', {
		value: any,
		writable: true,
		enumerable: false,
		configurable: true
	})
}
