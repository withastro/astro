import type { Signal } from './signals.js';

export type Reactive<T> = T | (() => T);

/** An element found by `scope()`, with helpers to bind it to signals. */
export interface Ref<E extends Element = HTMLElement> {
	el: E;
	/** The signal bound to this element's text (revived from the server if bound there). */
	text(): Signal<any>;
	/** Keeps this element's text in sync with a value or function. */
	text(fn: Reactive<unknown>): Ref<E>;
	/** A two-way signal for a form control's value. */
	value(): Signal<any>;
	/** A two-way signal for a checkbox or radio. */
	checked(): Signal<boolean>;
	attr(name: string): Signal<string | null>;
	attr(name: string, fn: Reactive<unknown>): Ref<E>;
	class(name: string, fn: Reactive<unknown>): Ref<E>;
	show(fn: Reactive<unknown>): Ref<E>;
	on<K extends keyof HTMLElementEventMap>(
		event: K,
		handler: (e: HTMLElementEventMap[K]) => void,
	): Ref<E>;
	on(event: string, handler: (e: Event) => void): Ref<E>;
}

type ItemData<T> = Partial<{ [K in keyof T]: T[K] extends Signal<infer V> ? V : T[K] }>;

export interface List<T> {
	/** The items, in order. Set it to reorder, filter or replace rows. */
	items: Signal<T[]>;
	/** Clones the template into a new row and fills its signals from `data`. */
	create(data?: ItemData<T>): T;
	add(data?: ItemData<T>): T;
	remove(item: T): void;
}

/** The `scope` function available inside `<script scoped>`. */
export interface Scope {
	/** The first element in this component instance matching `selector`. Throws if none. */
	(selector: string): Ref;
	all(selector: string): Ref[];
	/** Enhances a list: existing rows are adopted, new rows are cloned from `template`. */
	list<T>(container: string, template: string, row: (row: RowScope) => T): List<T>;
}

export interface RowScope extends Scope {
	root: Ref;
}
