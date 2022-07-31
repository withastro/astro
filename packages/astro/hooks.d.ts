interface Context__AstroComponent_<T> {
	value: T;
	(props: { value: T }): any
}

export interface Context<T> {
	value: T | undefined;

	constructor(initialValue: T|undefined): Context__AstroComponent_<T>;
}

export function createContext<T>(initialValue: T | undefined): Context__AstroComponent_<T>;

export function useContext<T extends ReturnType<typeof createContext>>(Context: T): T['value'];
