import { performance } from 'node:perf_hooks'

/** Returns the function bound to the given object. */
export const __function_bind = Function.bind.bind(
	Function.call as unknown as any
) as <TArgs extends any[], TFunc extends (...args: TArgs) => any>(
	callback: TFunc,
	thisArg: unknown,
	...args: TArgs
) => TFunc

/** Returns whether the object prototype exists in another object. */
export const __object_isPrototypeOf = Function.call.bind(
	Object.prototype.isPrototypeOf
) as { <T1 extends object, T2>(p: T1, v: T2): T2 extends T1 ? true : false }

/** Current high resolution millisecond timestamp. */
export const __performance_now = performance.now as () => number

// @ts-expect-error
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
