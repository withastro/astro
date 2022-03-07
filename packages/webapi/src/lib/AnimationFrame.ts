import { setTimeout as nodeSetTimeout, clearTimeout as nodeClearTimeout } from 'node:timers'
import * as _ from './utils.js'

const INTERNAL = { tick: 0, pool: new Map }

export function requestAnimationFrame<TArgs extends any[], TFunc extends (...args: TArgs) => any>(callback: TFunc): number {
	if (!INTERNAL.pool.size) {
		nodeSetTimeout(() => {
			const next = _.__performance_now()

			for (const func of INTERNAL.pool.values()) {
				func(next)
			}

			INTERNAL.pool.clear()
		}, 1000 / 16)
	}

	const func = _.__function_bind(callback, undefined)
	const tick = ++INTERNAL.tick

	INTERNAL.pool.set(tick, func)

	return tick
}

export function cancelAnimationFrame(requestId: number): void {
	const timeout = INTERNAL.pool.get(requestId)

	if (timeout) {
		nodeClearTimeout(timeout)

		INTERNAL.pool.delete(requestId)
	}
}
