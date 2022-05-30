import { useEffect, useState } from 'preact/hooks';
import { get } from '@astrojs/store';
import type { Readable } from '@astrojs/store';

export function useStore<T>(readable: Readable<T>) {
    const [state, setState] = useState(get(readable));

    useEffect(() => {
        return readable.subscribe(setState);
    }, []);

    return state;
}
