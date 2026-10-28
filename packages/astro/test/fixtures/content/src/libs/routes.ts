import { getCollection } from "astro:content";

export const routes = await getCollection("blog");

export function doSomething() {
  // …
}
