
export function get() {
	return {
		body: JSON.stringify([
			{ name: 'lettuce' },
			{ name: 'broccoli' },
			{ name: 'pizza' }
		])
	};
}
