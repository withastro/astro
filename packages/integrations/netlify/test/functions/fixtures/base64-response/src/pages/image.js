
export function get() {
	const buffer = Buffer.from('base64 test string', 'utf-8')

  return new Response(buffer, {
    status: 200,
		headers: {
			'content-type': 'image/jpeg;foo=foo'
		}
  });
}
