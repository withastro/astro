interface Options {
	escapeEverything: boolean;
	isIdentifier: boolean;
	quotes: 'single' | 'double';
	wrap: boolean;
}
export default function cssesc(string: string, options?: Partial<Options>): string;
export {};
