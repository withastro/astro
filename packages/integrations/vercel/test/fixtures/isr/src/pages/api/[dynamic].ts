export async function GET({ params }) {
  return new Response(`OK ${params.dynamic}`)
}
