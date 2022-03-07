import * as _ from './utils'

export const hasOwn = {
	hasOwn(instance: object, property: any) {
		return _.__object_hasOwnProperty(instance, property)
	}
}.hasOwn

export const initObject = (target: any, exclude: Set<string>) => {
	if (exclude.has('Object') || exclude.has('object') || exclude.has('hasOwn')) return

	const Class = target.Object || globalThis.Object

	Object.defineProperty(Class, 'hasOwn', {
		value: hasOwn,
		writable: true,
		enumerable: false,
		configurable: true
	})
}
