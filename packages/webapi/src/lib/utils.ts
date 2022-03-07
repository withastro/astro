import { performance } from 'node:perf_hooks'

/** Returns the milliseconds elapsed since January 1, 1970 00:00:00 UTC. */
export const __date_now = Date.now

/** Returns the function bound to the given object. */
export const __function_bind = Function.bind.bind(
	Function.call as unknown as any
) as <TArgs extends any[], TFunc extends (...args: TArgs) => any>(
	callback: TFunc,
	thisArg: unknown,
	...args: TArgs
) => TFunc

/** Returns the function called with the specified values. */
export const __function_call = Function.call.bind(
	Function.call as unknown as any
) as <TArgs extends any, TFunc extends (...args: TArgs[]) => any>(
	callback: TFunc,
	thisArg: unknown,
	...args: TArgs[]
) => ReturnType<TFunc>

/** Returns an object with the specified prototype. */
export const __object_create = Object.create as {
	<T extends any = any>(value: T): any extends T ? Record<any, any> : T
}

/** Returns whether an object has a property with the specified name. */
export const __object_hasOwnProperty = Function.call.bind(
	Object.prototype.hasOwnProperty
) as {
	<T1 extends object, T2>(object: T1, key: T2): T2 extends keyof T1
		? true
		: false
}

/** Returns a string representation of an object. */
export const __object_toString = Function.call.bind(
	Object.prototype.toString
) as { (value: any): string }

/** Returns whether the object prototype exists in another object. */
export const __object_isPrototypeOf = Function.call.bind(
	Object.prototype.isPrototypeOf
) as { <T1 extends object, T2>(p: T1, v: T2): T2 extends T1 ? true : false }

/** Current high resolution millisecond timestamp. */
export const __performance_now = performance.now as () => number

/** Returns the string escaped for use inside regular expressions. */
export const __string_escapeRegExp = (value: string) =>
	value.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')

// @ts-ignore
export const INTERNALS = new WeakMap<unknown, any>()

export const internalsOf = <T extends object>(
	target: T | object,
	className: string,
	propName: string
): T => {
	const internals: T = INTERNALS.get(target)

	if (!internals)
		throw new TypeError(
			`${className}.${propName} can only be used on instances of ${className}`
		)

	return internals
}

export const allowStringTag = (value: any) =>
	(value.prototype[Symbol.toStringTag] = value.name)

/** Returns any kind of path as a posix path. */
export const pathToPosix = (pathname: any) =>
	String(pathname == null ? '' : pathname)
		.replace(
			// convert slashes
			/\\+/g,
			'/'
		)
		.replace(
			// prefix a slash to drive letters
			/^(?=[A-Za-z]:\/)/,
			'/'
		)
		.replace(
			// encode path characters
			/%/g,
			'%25'
		)
		.replace(/\n/g, '%0A')
		.replace(/\r/g, '%0D')
		.replace(/\t/g, '%09')
