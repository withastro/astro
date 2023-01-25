
export interface Layer<K> {
	get(key: K): any | Promise<any>;
	cache(key: K, value: unknown): any | Promise<any>;
}
