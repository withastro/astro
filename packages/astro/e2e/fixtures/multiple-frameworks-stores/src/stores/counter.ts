import { Writable } from '@astrojs/store';

export interface CounterState {
	count: number;
}

export const decrement = (store: Writable<CounterState>) => store.update(({ count }) => ({ count: count - 1 }));
export const increment = (store: Writable<CounterState>) => store.update(({ count }) => ({ count: count + 1 }));
