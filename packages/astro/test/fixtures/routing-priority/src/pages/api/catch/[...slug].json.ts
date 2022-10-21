import type { APIRoute } from 'astro';

export const get: APIRoute = async ({ params }) => {
  return {
    body: JSON.stringify({
      path: params.slug,
    }),
  };
};

export function getStaticPaths() {
  return [{ params: { slug: 'a' } }, { params: { slug: 'b/c' } }];
}
