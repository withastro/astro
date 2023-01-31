export async function getStaticPaths() {
	return [
			{ params: { image: 1 } },
			{ params: { image: 2 } },
	];
}

export async function get({ params }) {
	return {
			body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200">
	<title>${params.image}</title>
</svg>`
	};
}
