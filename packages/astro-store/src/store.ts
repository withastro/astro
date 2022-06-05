import { getStoreValue, isFunction, noop, runAll, safeNotEqual, subscribe } from './utils';

export type Subscriber<T> = (value: T) => void;
export type Unsubscriber = () => void;
export type Updater<T> = (value: T) => T;
export type StartStopNotifier<T> = (set: Subscriber<T>) => Unsubscriber | void;

type Invalidator<T> = (value?: T) => void;

export interface Readable<T> {
    subscribe(this: void, run: Subscriber<T>, invalidate?: Invalidator<T>): Unsubscriber;
}

export interface Writable<T> extends Readable<T> {
    set(this: void, value: T): void;
    update(this: void, updater: Updater<T>): void;
}

type SubscribeInvalidateTuple<T> = [Subscriber<T>, Invalidator<T>];

const subscriberQueue: any[] = [];

export function readable<T>(value?: T, start?: StartStopNotifier<T>): Readable<T> {
    return {
        subscribe: writable(value, start).subscribe
    }
}

export function writable<T>(value?: T, start: StartStopNotifier<T> = noop): Writable<T> {
    let stop: Unsubscriber | null = null;
    const subscribers: Set<SubscribeInvalidateTuple<T>> = new Set();

    function set(newValue: T): void {
        if (safeNotEqual(value, newValue)) {
            value = newValue;
            if (stop !== null) { // store is ready
                const runQueue = !subscriberQueue.length;
                for (const subscriber of subscribers) {
                    subscriber[1]();
                    subscriberQueue.push(subscriber, value);
                }
                if (runQueue) {
                    for (let i = 0; i < subscriberQueue.length; i += 2) {
                        subscriberQueue[i][0](subscriberQueue[i + 1]);
                    }
                    subscriberQueue.length = 0;
                }
            }
        }
    }

    function update(fn: Updater<T>): void {
        set(fn(value!));
    }

    function subscribe(run: Subscriber<T>, invalidate: Invalidator<T> = noop): Unsubscriber {
        const subscriber: SubscribeInvalidateTuple<T> = [run, invalidate];
        subscribers.add(subscriber);
        if (subscribers.size === 1) {
            stop = start(set) || noop;
        }

        run(value!);

        return () => {
            subscribers.delete(subscriber);
            if (subscribers.size === 0) {
                stop!();
                stop = null;
            }
        }
    }

    return {
        set,
        update,
        subscribe
    };
}

type Stores = Readable<any> | [Readable<any>, ...Array<Readable<any>>] | Array<Readable<any>>;

type StoresValues<T> = T extends Readable<infer U> ? U :
    { [K in keyof T]: T[K] extends Readable<infer U> ? U : never };

export function derived<S extends Stores, T>(
    stores: S,
    fn: (values: StoresValues<S>, set: (value: T) => void) => Unsubscriber | void,
    initialValue?: T
): Readable<T>;

export function derived<S extends Stores, T>(
    stores: S,
    fn: (values: StoresValues<S>) => T,
    initialValue?: T
): Readable<T>;

export function derived<S extends Stores, T>(
    stores: S,
    fn: (values: StoresValues<S>) => T
): Readable<T>;

export function derived<T>(stores: Stores, fn: Function, initialValue?: T): Readable<T> {
    const isSingle = !Array.isArray(stores);
    const storesArray: Array<Readable<any>> = isSingle
        ? [stores as Readable<any>]
        : stores as Array<Readable<any>>;

    const auto = fn.length < 2;

    return readable(initialValue, (set) => {
        let initialized = false;
        const values: any[] = [];

        let pending = 0;
        let cleanup = noop;

        const sync = () => {
            if (pending) {
                return;
            }

            cleanup();

            const result = fn(isSingle ? values[0] : values, set);

            if (auto) {
                set(result as T);
            } else {
                cleanup = isFunction(result) ? result as Unsubscriber : noop;
            }
        };

        const unsubscribers = storesArray.map((store, i) => subscribe(
            store,
            (value: any) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (initialized) {
                    sync();
                }
            },
            () => {
                pending |= (1 << i);
            }
        ));

        initialized = true;
        sync();

        return function stop() {
            runAll(unsubscribers);
            cleanup();
        };
    });
}

console.log("SSR?", typeof window === 'undefined');
export const store = typeof window === 'undefined' ? readable : writable;

export const get = getStoreValue;
