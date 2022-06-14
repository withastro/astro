
export function get() {
	const buffer = Buffer.from('base64 test string', 'utf-8')

  return new Response(buffer.toString('base64'), {
    status: 200
  });
}
