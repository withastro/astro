import { z } from "zod";

export const prerender = false;

export async function GET() {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });
  const json = z.toJSONSchema(schema);
  return Response.json(json);
}
