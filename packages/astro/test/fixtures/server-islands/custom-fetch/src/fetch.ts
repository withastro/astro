import { astro, FetchState } from 'astro/fetch';

export default {
  fetch: (request: Request) => astro(new FetchState(request)),
};
