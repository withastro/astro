export const GET = ({ url }) => new Response(null, { headers: { Location: "https://example.com/destination" }, status: 307 })
