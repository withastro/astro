import type { Readable } from '@astrojs/store';

export function useStore<T>(readable: Readable<T>) {
	return readable;
}
