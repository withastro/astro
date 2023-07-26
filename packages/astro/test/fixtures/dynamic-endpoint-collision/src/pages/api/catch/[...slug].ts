import type { APIRoute } from "astro";

const slugs = ["one", undefined];

export const GET: APIRoute = ({ params }) => {
  return {
    body: JSON.stringify({
      slug: params.slug || "index",
    }),
  };
};

export function getStaticPaths() {
  return slugs.map((u) => ({ params: { slug: u } }));
}
