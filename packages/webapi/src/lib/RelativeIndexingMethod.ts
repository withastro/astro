type TypedArray =
	| Int8Array
	| Uint8Array
	| Uint8ClampedArray
	| Int16Array
	| Uint16Array
	| Int32Array
	| Uint32Array
	| Float32Array
	| Float64Array
	| BigInt64Array
	| BigUint64Array

export const at = {
	at<T extends Array<any> | string | TypedArray>(this: T, index: number) {
		index = Math.trunc(index) || 0

		if (index < 0) index += this.length

		if (index < 0 || index >= this.length) return undefined

		return this[index]
	},
}.at

export const initRelativeIndexingMethod = (
	target: any,
	exclude: Set<string>
) => {
	if (exclude.has('at')) return

	const Classes = []

	if (!exclude.has('TypedArray'))
		Classes.push(
			Object.getPrototypeOf(target.Int8Array || globalThis.Int8Array)
		)
	if (!exclude.has('Array')) Classes.push(target.Array || globalThis.Array)
	if (!exclude.has('String')) Classes.push(target.String || globalThis.String)

	for (const Class of Classes) {
		if (!Class.prototype.at)
			Object.defineProperty(Class.prototype, 'at', {
				value: at,
				writable: true,
				enumerable: false,
				configurable: true,
			})
	}
}
