/** @type {import('astro').APIRoute} */
export function post({ cookies }) {
	cookies.set('foo', 'foo', {
		httpOnly: true
	});
	cookies.set('bar', 'bar', {
		httpOnly: true
	});
  return new Response('', {
    status: 201,
  });
}
