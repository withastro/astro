
export function get({ params }) {
	return {
		body: JSON.stringify(params)
	};
}
