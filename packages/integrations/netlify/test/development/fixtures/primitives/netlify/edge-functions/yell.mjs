export default async (req, context) => {
  const res = await context.next()
  const body = await res.text()

  return new Response(body.toUpperCase(), res)
}

export const config = {
  path: "/processed/*"
}
