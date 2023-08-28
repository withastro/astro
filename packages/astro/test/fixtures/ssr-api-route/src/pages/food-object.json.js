// NOTE: test deprecated object form
export function GET() {
	return {
		body: JSON.stringify([
			{ name: 'lettuce' },
			{ name: 'broccoli' },
			{ name: 'pizza' }
		])
	};
}
