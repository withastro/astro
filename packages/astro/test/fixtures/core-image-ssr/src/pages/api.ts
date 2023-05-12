import { APIRoute } from "../../../../../src/@types/astro";

export const get = (async ({ params, request }) => {
	const url = new URL(request.url);
	console.log(url)
  const src = url.searchParams.get("src");

	return {
		body: "An image: " + JSON.stringify(src),
	};
}) satisfies APIRoute;
