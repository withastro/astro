import { defineConfig } from 'astro/config';
export default defineConfig({
  integrations: [
    {
      name: 'astro-test-feature-support-message-suppression',
      hooks: {
        'astro:config:done': ({ setAdapter }) => {
          setAdapter({
            name: 'astro-test-feature-support-message-suppression',
            supportedAstroFeatures: {
              staticOutput: "stable",
              hybridOutput: "stable",
              serverOutput: {
                support: "experimental",
                message: "This should be logged.",
                suppress: "default",
              },
              sharpImageService: {
                support: 'limited',
                message: 'This shouldn\'t be logged.',
                suppress: "all",
              },
            }
          })
        },
      },
    },
  ],
});
