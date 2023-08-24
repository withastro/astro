
export function GET({ params }) {
	return {
		body: JSON.stringify(params)
	};
}
