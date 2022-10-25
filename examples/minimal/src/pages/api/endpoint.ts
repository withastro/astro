export const get = ({ request }) => {
	console.log(request);
	return new Response("Hello world!");
}
