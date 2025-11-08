import type { EndpointHandler } from 'astro';

export const GET: EndpointHandler = async ({ params }) => {
  return new Response(
    JSON.stringify({
      path: params.slug,
    })
  );
};

export function getStaticPaths() {
  return [{ params: { slug: 'a' } }, { params: { slug: 'b/c' } }];
}
