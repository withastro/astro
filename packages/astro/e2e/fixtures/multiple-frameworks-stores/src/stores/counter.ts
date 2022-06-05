import { Readable, writable, store } from '@astrojs/store';

export interface CounterState {
	count: number;
}

export interface CounterStore extends Readable<CounterState> {
	increment(): void;
	decrement(): void;
	reset(): void;
}

export default function createCounter(initial: CounterState = { count: 0 }): CounterStore {
	const { subscribe, set, update } = store<CounterState>(initial);

	return {
		subscribe,
		increment: () => update(({ count }) => ({
			count: count + 1
		})),
		decrement: () => update(({ count }) => ({
			count: count - 1
		})),
		reset: () => set({ count: 0 })
	}
}
