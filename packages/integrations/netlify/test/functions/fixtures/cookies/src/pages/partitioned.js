
export function GET({ cookies }) {
	cookies.set('partitioned-cookie', 'value', { partitioned: true, secure: true });
	return new Response('ok');
}
