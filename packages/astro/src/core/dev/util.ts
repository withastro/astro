/** Pad string () */
export function pad(input: string, minLength: number, dir?: 'left' | 'right'): string {
	let output = input;
	while (output.length < minLength) {
		output = dir === 'left' ? ' ' + output : output + ' ';
	}
	return output;
}

export function emoji(char: string, fallback: string) {
	return process.platform !== 'win32' ? char : fallback;
}

export function getLocalAddress(serverAddress: string, configHostname: string): string {
	if (configHostname === 'localhost' || serverAddress === '127.0.0.1' || serverAddress === '0.0.0.0') {
		return 'localhost';
	} else {
		return serverAddress;
	}
}
