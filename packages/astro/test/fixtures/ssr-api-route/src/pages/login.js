
export function post() {
  const headers = new Headers();
  headers.append('Set-Cookie', `foo=foo; HttpOnly`);
  headers.append('Set-Cookie', `bar=bar; HttpOnly`);

  return new Response('', {
    status: 201,
    headers,
  });
}
