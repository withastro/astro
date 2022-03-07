import { Event } from 'event-target-shim'

/** An event fired by a context requester to signal it desires a named context. */
export class ContextEvent<T = unknown> extends Event<'context-request'> {
	constructor(init: ContextEventInit<T>) {
		super('context-request', { bubbles: true, composed: true })

		init = Object(init) as Required<ContextEventInit<T>>

		this.context = init.context
	}

	context!: Context<T>
	multiple!: boolean
	callback!: ContextCallback<Context<T>>
}

interface ContextEventInit<T = unknown> {
	context: Context<T>
	multiple?: boolean
	callback: ContextCallback<Context<T>>
}

/** A Context object defines an optional initial value for a Context, as well as a name identifier for debugging purposes. */
export type Context<T = unknown> = {
	name: string
	initialValue?: T
}

/** A helper type which can extract a Context value type from a Context type. */
export type ContextType<T extends Context> = T extends Context<infer Y>
	? Y
	: never

/** A function which creates a Context value object */
export function createContext<T>(
	name: string,
	initialValue?: T
): Readonly<Context<T>> {
	return {
		name,
		initialValue,
	}
}

/** A callback which is provided by a context requester and is called with the value satisfying the request. */
export type ContextCallback<ValueType> = (
	value: ValueType,
	dispose?: () => void
) => void

declare global {
	interface HTMLElementEventMap {
		/** A 'context-request' event can be emitted by any element which desires a context value to be injected by an external provider. */
		'context-request': ContextEvent
	}
}
