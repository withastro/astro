export const GET = () => {
	const headers = new Headers();
	headers.append('x-single', 'single');
	headers.append('x-triple', 'one');
	headers.append('x-triple', 'two');
	headers.append('x-triple', 'three');
	headers.append('Set-cookie', 'hello');
	headers.append('Set-Cookie', 'world');
	return new Response(null, { headers });
}
