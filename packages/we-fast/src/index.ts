/**
 * WE-FAST Core SDK Entry Point (`index.ts`)
 * Programmatic interface for generating and inspecting multi-framework websites.
 */

export * from './gfx-engine.js';
export * from './bootstrap-system.js';
export * from './templates/index.js';
export * from './code-generators.js';

import { WE_FAST_TEMPLATES, WeFastSiteTemplate } from './templates/index.js';
import { MultiFrameworkCodeGenerator, GeneratedFile } from './code-generators.js';

export class WeFastEngine {
  public static getTemplate(id: string): WeFastSiteTemplate | undefined {
    return WE_FAST_TEMPLATES.find((t) => t.id === id);
  }

  public static listTemplates(): WeFastSiteTemplate[] {
    return WE_FAST_TEMPLATES;
  }

  public static exportProject(
    templateOrId: string | WeFastSiteTemplate,
    target: 'astro' | 'nuxt' | 'svelte' | 'html' = 'astro'
  ): GeneratedFile[] {
    const template = typeof templateOrId === 'string' ? this.getTemplate(templateOrId) : templateOrId;
    if (!template) {
      throw new Error(`WE-FAST Template "${templateOrId}" not found.`);
    }

    switch (target) {
      case 'astro':
        return MultiFrameworkCodeGenerator.generateAstroProject(template);
      case 'nuxt':
        return MultiFrameworkCodeGenerator.generateNuxtProject(template);
      case 'svelte':
        return MultiFrameworkCodeGenerator.generateSvelteProject(template);
      case 'html':
        return MultiFrameworkCodeGenerator.generateStaticHtml(template);
      default:
        return MultiFrameworkCodeGenerator.generateAstroProject(template);
    }
  }
}
