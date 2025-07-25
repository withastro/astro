import { z as astroZod } from "astro/zod";
import { z as zodContent} from "astro:content";
import { z } from "zod";

export const prerender = false;

export async function GET() {
  return Response.json({
		astroZodIsZod4: "toJSONSchema" in astroZod,
		astroContentZodIsZod4: "toJSONSchema" in zodContent,
		astroZodAndZodContentAreSame: astroZod === zodContent,
		zodIsZod4: "toJSONSchema" in z,
	});
}
