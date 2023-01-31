
export function get() {
	const buffer = Buffer.from('base64 test font', 'utf-8')

  return new Response(buffer, {
    status: 200,
		headers: {
			'Content-Type': 'font/otf'
		}
  });
}
