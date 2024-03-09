import type { AstroIntegration } from 'astro';
import tailwindcss from '@tailwindcss/vite'

type TailwindOptions = {
    /**
     * Apply Tailwind's base styles
     * Disabling this is useful when further customization of Tailwind styles
     * and directives is required. See {@link https://tailwindcss.com/docs/functions-and-directives#tailwind Tailwind's docs}
     * for more details on directives and customization.
     * @default true
     */
    applyBaseStyles?: boolean;
};

export default function tailwindIntegration(options?: TailwindOptions): AstroIntegration {
    const applyBaseStyles = options?.applyBaseStyles ?? true;

    return {
        name: '@astrojs/tailwind',
        hooks: {
            'astro:config:setup': async ({ updateConfig, injectScript }) => {
                // Inject the Tailwind postcss plugin
                updateConfig({
                    vite: {
                      plugins: [...tailwindcss()],
                      css: { transformer: 'lightningcss' },
                    }
                });

                if (applyBaseStyles) {
                    // Inject the Tailwind base import
                    injectScript('page-ssr', `import '@astrojs/tailwind/base.css';`);
                }
            },
        },
    };
}