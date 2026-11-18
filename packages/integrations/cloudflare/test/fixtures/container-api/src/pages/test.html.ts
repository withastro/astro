import type { APIRoute } from 'astro';
import { experimental_AstroContainer } from 'astro/container';
import Hello from '../components/Hello.astro';

export const GET: APIRoute = async () => {
  const container = await experimental_AstroContainer.create();
  const result = await container.renderToString(Hello, {
    props: { name: 'World' },
  });
  return new Response(result, {
    headers: { 'Content-Type': 'text/html' },
  });
};
