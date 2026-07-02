import { createSignal } from 'solid-js';

const ISLAND_SIGNAL = Symbol.for('astro.solid.island-signal');
const ISLAND_SIGNAL_PEEK = Symbol.for('astro.solid.island-signal.peek');
const ISLAND_SETTER_FOR = Symbol.for('astro.solid.island-signal.setter-for');

export type IslandAccessor<T> = (() => T) & {
	[ISLAND_SIGNAL]: true;
	[ISLAND_SIGNAL_PEEK]: () => T;
};

export type IslandSetter<T> = ((v: T | ((prev: T) => T)) => T) & {
	[ISLAND_SETTER_FOR]: IslandAccessor<T>;
};

/**
 * Creates a signal that can be shared across multiple Solid islands.
 * Use this in `.astro` frontmatter to pass reactive state to `client:*` components.
 *
 * ```astro
 * ---
 * import { createIslandSignal } from '@astrojs/solid-js/signals';
 * const [count, setCount] = createIslandSignal(0);
 * ---
 * <Counter count={count} client:load />
 * <Display count={count} client:load />
 * ```
 */
export function createIslandSignal<T>(value: T): [IslandAccessor<T>, IslandSetter<T>] {
	const [get, set] = createSignal(value);

	const accessor = get as IslandAccessor<T>;
	accessor[ISLAND_SIGNAL] = true;
	accessor[ISLAND_SIGNAL_PEEK] = () => get();

	const setter = set as unknown as IslandSetter<T>;
	setter[ISLAND_SETTER_FOR] = accessor;

	return [accessor, setter];
}

export function isIslandSignal(x: any): x is IslandAccessor<any> {
	return typeof x === 'function' && x[ISLAND_SIGNAL] === true;
}

export function isIslandSetter(x: any): x is IslandSetter<any> {
	return typeof x === 'function' && x[ISLAND_SETTER_FOR] != null;
}

export function peekIslandSignal<T>(x: IslandAccessor<T>): T {
	return x[ISLAND_SIGNAL_PEEK]();
}

export function getSetterAccessor<T>(x: IslandSetter<T>): IslandAccessor<T> {
	return x[ISLAND_SETTER_FOR];
}
