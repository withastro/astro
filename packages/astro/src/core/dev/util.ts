/** Pad string () */
export function pad(input: string, minLength: number, dir?: 'left' | 'right'): string {
	let output = input;
	while (output.length < minLength) {
		output = dir === 'left' ? ' ' + output : output + ' ';
	}
	return output;
}
