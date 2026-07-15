/**
 * WE-FAST CLI Implementation (`cli.ts`)
 * Executable commands for creating, generating, and inspecting websites from terminal.
 */

import fs from 'node:fs';
import path from 'node:path';
import { WeFastEngine } from './index.js';

export async function runCLI(args: string[]): Promise<void> {
  const command = args[0] || 'help';

  if (command === 'list') {
    console.log('\n🚀 WE-FAST Multi-Framework Built-in Templates:\n');
    WeFastEngine.listTemplates().forEach((t) => {
      console.log(`  • [${t.id}] ${t.name}`);
      console.log(`    Theme: ${t.themeKey} | Blocks: ${t.blocks.length} (${t.blocks.map((b) => b.framework).join(', ')})`);
      console.log(`    Description: ${t.description}\n`);
    });
    return;
  }

  if (command === 'create' || command === 'generate') {
    const templateId = args[1] || 'saas-ai';
    const targetIdx = args.indexOf('--target');
    const target = targetIdx !== -1 && args[targetIdx + 1] ? (args[targetIdx + 1] as any) : 'astro';
    const outDirIdx = args.indexOf('--outDir');
    const outDir = outDirIdx !== -1 && args[outDirIdx + 1] ? args[outDirIdx + 1] : `./output-${templateId}-${target}`;

    console.log(`\n⚡ WE-FAST Engine: Generating project "${templateId}" for target [${target.toUpperCase()}] into "${outDir}"...\n`);

    const template = WeFastEngine.getTemplate(templateId);
    if (!template) {
      console.error(`❌ Template "${templateId}" not found. Run "we-fast list" to see available options.`);
      process.exit(1);
    }

    const files = WeFastEngine.exportProject(template, target);
    files.forEach((file) => {
      const fullPath = path.join(outDir, file.path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, file.content, 'utf-8');
      console.log(`  ✓ Created ${file.path} (${file.language})`);
    });

    console.log(`\n🎉 Success! Your multi-framework project is ready in "${outDir}".`);
    console.log(`   Next steps: cd ${outDir} && pnpm install && pnpm dev\n`);
    return;
  }

  if (command === 'studio') {
    console.log('\n🌟 Launching WE-FAST Visual Studio Web Application...');
    console.log('   Run: cd examples/we-fast && pnpm dev --port 4321\n');
    return;
  }

  console.log(`
⚡ WE-FAST CLI v1.0.0 — Multi-Framework Website Creator
Combining Astro, Nuxt/Vue, Bootstrap 5, Svelte, and GFX Shaders.

Usage:
  we-fast list                              List all built-in website templates
  we-fast create <template-id>              Create a website project (default target: astro)
  we-fast generate <template-id> --target <astro|nuxt|svelte|html> --outDir <path>
  we-fast studio                            Instructions to launch the live Visual Studio

Examples:
  we-fast create saas-ai --target astro --outDir ./my-ai-site
  we-fast generate ecommerce-nextgen --target html --outDir ./static-shop
`);
}
