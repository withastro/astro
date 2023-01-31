
export function getStaticPaths() {
	return [
		{
			params: {
				param: 'one'
			}
		},
		{
			params: {
				param: 'two'
			}
		},
	]
}

export function get(params) {
	return {
		body: JSON.stringify({
			param: params.param
		})
	};
}
