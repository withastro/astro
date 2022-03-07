import {
	setTimeout as nodeSetTimeout,
	clearTimeout as nodeClearTimeout,
} from 'node:timers'
import * as _ from './utils.js'

const INTERNAL = { tick: 0, pool: new Map() }

export function setTimeout<
	TArgs extends any[],
	TFunc extends (...args: TArgs) => any
>(callback: TFunc, delay = 0, ...args: TArgs): number {
	const func = _.__function_bind(callback, globalThis)
	const tick = ++INTERNAL.tick
	const timeout = nodeSetTimeout(func, delay, ...args)

	INTERNAL.pool.set(tick, timeout)

	return tick
}

export function clearTimeout(timeoutId: number): void {
	const timeout = INTERNAL.pool.get(timeoutId)

	if (timeout) {
		nodeClearTimeout(timeout)

		INTERNAL.pool.delete(timeoutId)
	}
}
