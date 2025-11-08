import type { EndpointHandler } from 'astro';

export const GET: EndpointHandler = async ({ params }) => {
  return new Response(
    JSON.stringify({
      foo: params.foo,
      bar: params.bar,
    })
  );
};

export function getStaticPaths() {
  return [{ params: { foo: 'a', bar: 'b' } }];
}
