export default {
  async fetch(request: Request) {
    if (request.method === 'POST') await request.json();
    return new Response('ok');
  },
};
