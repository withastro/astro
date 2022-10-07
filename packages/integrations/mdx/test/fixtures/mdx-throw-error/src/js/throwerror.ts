export function throwError() {
	console.log(`I'm going to throw an error. The server will just keep spinning until it runs out of memory...`);

	throw new Error('Oh no');
}
