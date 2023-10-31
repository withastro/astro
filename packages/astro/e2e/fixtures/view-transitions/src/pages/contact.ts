import type { APIContext } from 'astro';

export const POST = async ({ request, redirect }: APIContext) => {
	const formData = await request.formData();
	const name = formData.get('name');
	return redirect(`/form-response?name=${name}`);
}

export const GET = async ({ url, redirect }: APIContext) => {
	const name = url.searchParams.get('name');
	return redirect(`/form-response?name=${name}`);
}
