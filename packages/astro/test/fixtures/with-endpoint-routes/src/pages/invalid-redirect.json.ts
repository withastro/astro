export const get = () => {
  return new Response(
    undefined,
    {
      status: 301,
      headers: {
        Location: 'https://example.com',
      }
    }
  );
};
