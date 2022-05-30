import { createEffect, createSignal, onCleanup } from 'solid-js';
import { get } from '@astrojs/store';
import type { Readable } from '@astrojs/store';

export function useStore<T>(readable: Readable<T>) {
    const [state, setState] = createSignal(get(readable));

    createEffect(() => {
        onCleanup(readable.subscribe(setState as (value: T) => void));
    });

    return state;
}
