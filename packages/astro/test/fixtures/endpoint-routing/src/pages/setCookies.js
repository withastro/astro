export const GET = context => {
	const headers = new Headers();
	context.cookies.set('key1', 'value1');
	context.cookies.set('key2', 'value2');
	headers.append('set-cookie', 'key3=value3');
	headers.append('set-cookie', 'key4=value4');
	return new Response(null, { headers });
}
