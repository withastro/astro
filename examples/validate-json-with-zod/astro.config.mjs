import { defineConfig } from 'astro/config';
import { z } from 'astro:content';

// https://astro.build/config
export default defineConfig({
  jsonDataFiles: [{
    path: "src/data.json",
    schema: z.object({
      name: z.string(),
      images: z.array(z.object({
        imageSrc: z.string(),
        imageAlt: z.string()
      }))
    })
  }]
});
