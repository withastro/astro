import type { Readable } from "./store";

export function getStoreValue<T>(store: Readable<T>): T {
    let value: T | undefined = undefined;
    subscribe(store, (t: T) => value = t)();
    return value!;
}

export function isFunction(thing: any): thing is Function {
    return typeof thing === 'function';
}

export function noop() {}

export function run(fn: Function) {
    fn();
}

export function runAll(fns: Function[]) {
    fns.forEach(run);
}

export function safeNotEqual(a: any, b: any) {
    return a != a
        ? b == b
        : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

export function subscribe<T>(store: Readable<T>, ...callbacks: any[]) {
    if (store == null) {
        return noop;
    }

    const result = (store.subscribe as any)(...callbacks);
    return result.unsubscribe ? () => result.unsubscribe() : result;
}
