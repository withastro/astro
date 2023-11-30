export async function GET({}) {
  return {
    body: JSON.stringify({
      name: 'Astro',
      url: 'https://astro.build/',
    }),
  };
}
