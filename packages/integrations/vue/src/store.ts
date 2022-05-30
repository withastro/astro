import { getCurrentScope, onScopeDispose, readonly, shallowRef } from 'vue';
import { get } from '@astrojs/store';
import type { Readable } from '@astrojs/store';

export function useStore<T>(readable: Readable<T>) {
    const state = shallowRef(get(readable));

    const unsubscribe = readable.subscribe(value => state.value = value);
    getCurrentScope() && onScopeDispose(unsubscribe);

    return readonly(state);
}
