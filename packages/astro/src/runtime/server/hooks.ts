const CONTEXT = Symbol.for('astro:context');

class Context<T> {
	value: T | undefined;

	constructor(initialValue: T|undefined) {
		this.value = initialValue;
		Object.defineProperty(this, CONTEXT, {
			enumerable: false,
			writable: false,
			value: true,
		})
	}

	get() {
		return this.value;
	}

	set(value: T) {
		this.value = value;
	}

	reset() {}
}

export function createContext<T>(initialValue: T | undefined) {
	return new Context<T>(initialValue);
}

export const useContext = ({ value }: any) => {
	return value;
}
