import { signal as rawSignal } from 'alien-signals';

export { computed, effect, effectScope } from 'alien-signals';

/** A callable signal: `count()` reads, `count(1)` writes. */
export interface Signal<T> {
	(): T;
	(value: T): void;
}

export const SIGNAL_ID = Symbol.for('astro-ui.signal-id');

type ServerSignal<T> = Signal<T> & { [SIGNAL_ID]?: string };

let nextId = 0;

/**
 * Creates a signal. Signals created during server rendering get an id, so the
 * client can revive each one once and share it between every place it is bound.
 */
export function signal<T>(value: T): Signal<T> {
	const s = rawSignal(value) as ServerSignal<T>;
	if (typeof document === 'undefined') s[SIGNAL_ID] = 's' + (++nextId).toString(36);
	return s;
}

export function getSignalId(value: unknown): string | undefined {
	if (typeof value !== 'function') return undefined;
	const id = (value as ServerSignal<unknown>)[SIGNAL_ID];
	return typeof id === 'string' ? id : undefined;
}
