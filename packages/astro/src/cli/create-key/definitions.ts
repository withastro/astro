export interface KeyGenerator {
	generate: () => Promise<string>;
}
