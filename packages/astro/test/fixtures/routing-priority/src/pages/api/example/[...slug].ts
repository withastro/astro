import type { APIRoute } from "astro";

const slugs = ["one", 'index'];

export const prerender = true;

export const get: APIRoute = ({ params }) => {
  return {
    body: JSON.stringify({
      slug: params.slug || "index",
    }),
  };
};

export function getStaticPaths() {
  return slugs.map((u) => ({ params: { slug: u } }));
}
