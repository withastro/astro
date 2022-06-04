export async function post({ request }) {
	const formData = await request.formData();

	return new Response(formData.get('username'));
}
