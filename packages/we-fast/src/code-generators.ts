/**
 * WE-FAST Multi-Framework Code Generator (`code-generators.ts`)
 * Converts visual AST / block configurations into exact production code files for:
 * - Astro Hybrid Project (`.astro`, `.vue`, `.svelte`, `.css`)
 * - Nuxt 4 / Vue 3 Project (`app.vue`, `components/*.vue`)
 * - Svelte 5 / SvelteKit Project (`+page.svelte`, `components/*.svelte`)
 * - Static HTML + Bootstrap 5 + GFX Engine (`index.html`, `style.css`, `gfx.js`)
 */

import { WeFastComponentBlock, WeFastSiteTemplate } from './templates/index.js';
import { BootstrapGenerator, BOOTSTRAP_THEMES } from './bootstrap-system.js';

export interface GeneratedFile {
  path: string;
  content: string;
  language: 'astro' | 'vue' | 'svelte' | 'html' | 'css' | 'typescript' | 'javascript' | 'json';
}

export class MultiFrameworkCodeGenerator {
  /**
   * Export to Astro Hybrid Project (combines all frameworks via island hydration)
   */
  public static generateAstroProject(template: WeFastSiteTemplate): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const theme = BOOTSTRAP_THEMES[template.themeKey] || BOOTSTRAP_THEMES.cyberNeon;

    // 1. package.json
    files.push({
      path: 'package.json',
      language: 'json',
      content: JSON.stringify(
        {
          name: `${template.id}-astro-site`,
          type: 'module',
          version: '1.0.0',
          scripts: {
            dev: 'astro dev',
            build: 'astro build',
            preview: 'astro preview',
          },
          dependencies: {
            astro: '^7.0.0',
            '@astrojs/vue': '^7.0.0',
            '@astrojs/svelte': '^9.0.0',
            vue: '^3.5.0',
            svelte: '^5.0.0',
          },
        },
        null,
        2
      ),
    });

    // 2. astro.config.mjs
    files.push({
      path: 'astro.config.mjs',
      language: 'javascript',
      content: `import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import svelte from '@astrojs/svelte';

export default defineConfig({
  integrations: [vue(), svelte()],
});
`,
    });

    // 3. src/styles/bootstrap.css
    files.push({
      path: 'src/styles/bootstrap.css',
      language: 'css',
      content: BootstrapGenerator.generateCSS(template.themeKey),
    });

    // 4. Generate component files and collect import statements for index.astro
    const imports: string[] = [];
    const pageBlocks: string[] = [];

    template.blocks.forEach((block, index) => {
      if (block.framework === 'bootstrap' || block.framework === 'astro') {
        // Generate Astro Component
        const compName = `Block${index}_${block.type}`;
        imports.push(`import ${compName} from '../components/${compName}.astro';`);
        pageBlocks.push(`    <div class="${block.colSpan} ${block.padding}">\n      <${compName} {...${JSON.stringify(block.props)}} />\n    </div>`);

        files.push({
          path: `src/components/${compName}.astro`,
          language: 'astro',
          content: `---
// WE-FAST Astro Hybrid Component: ${block.title}
const { ${Object.keys(block.props).join(', ')} } = Astro.props;
---
<div class="wefast-block ${block.type} card">
  ${
    block.type === 'BootstrapNavbar'
      ? `<header class="navbar">
    <a href="#" class="navbar-brand">
      <span>{brandName}</span>
      {brandBadge && <span class="badge bg-primary">{brandBadge}</span>}
    </a>
    <nav class="d-flex gap-3 align-items-center">
      {links?.map((link: string) => <a href="#" class="btn btn-outline-light py-1">{link}</a>)}
      {ctaText && <a href="#" class="btn btn-primary">{ctaText}</a>}
    </nav>
  </header>`
      : `<footer class="text-center py-4">
    <p class="text-muted mb-1">&copy; {copyrightYear} {companyName}. All rights reserved.</p>
    {tagline && <p class="text-secondary" style="font-size: 0.85rem;">{tagline}</p>}
  </footer>`
  }
</div>`,
        });
      } else if (block.framework === 'vue' || block.framework === 'gfx') {
        // Generate Vue 3 / GFX Component
        const compName = `Block${index}_${block.type}`;
        imports.push(`import ${compName} from '../components/${compName}.vue';`);
        const clientAttr = block.islandHydration !== 'static' ? ` ${block.islandHydration}` : '';
        pageBlocks.push(`    <div class="${block.colSpan} ${block.padding}">\n      <${compName}${clientAttr} :props="${JSON.stringify(block.props).replace(/"/g, "'")}" />\n    </div>`);

        if (block.framework === 'gfx') {
          files.push({
            path: `src/components/${compName}.vue`,
            language: 'vue',
            content: `<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{
  props?: {
    heading?: string;
    subheading?: string;
    btnPrimaryText?: string;
    btnSecondaryText?: string;
  }
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animId: number;

onMounted(() => {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;
  
  let time = 0;
  const render = () => {
    time += 0.02;
    const w = ctx.canvas.width = canvasRef.value!.clientWidth || 800;
    const h = ctx.canvas.height = canvasRef.value!.clientHeight || 450;
    const cx = w / 2, cy = h / 2;
    
    // Cyber Tunnel GFX Shader Simulation
    ctx.fillStyle = '${theme.bgDark || '#050714'}';
    ctx.fillRect(0, 0, w, h);
    
    const rings = 20;
    for (let i = rings; i >= 1; i--) {
      const r = ((time * 70 + i * (Math.max(w, h) / rings)) % Math.max(w, h)) * 0.7;
      const alpha = Math.max(0.1, (1 - r / Math.max(w, h)) * 0.9);
      const hue = (time * 60 + i * 15) % 360;
      ctx.beginPath();
      ctx.arc(cx + Math.sin(time + i*0.2)*20, cy + Math.cos(time + i*0.2)*20, r, 0, Math.PI * 2);
      ctx.strokeStyle = \`hsla(\${hue}, 85%, 60%, \${alpha})\`;
      ctx.lineWidth = Math.max(1.5, r / 70);
      ctx.stroke();
    }
    animId = requestAnimationFrame(render);
  };
  render();
});

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId);
});
</script>

<template>
  <div class="gfx-hero card text-center py-5 position-relative" style="min-height: 480px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
    <canvas ref="canvasRef" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0.85;"></canvas>
    <div style="position: relative; z-index: 2; max-width: 760px; margin: 0 auto; padding: 2rem;">
      <h1 style="font-size: 2.8rem; font-weight: 900; margin-bottom: 1.2rem; background: linear-gradient(135deg, #fff 0%, var(--bs-primary) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
        {{ props?.heading || 'GFX Interactive Hero' }}
      </h1>
      <p class="text-light mb-4" style="font-size: 1.2rem; opacity: 0.9; line-height: 1.7;">
        {{ props?.subheading || 'Driven by Direct3D12/WebGL inspired shader reflection and runtime kernel reloading.' }}
      </p>
      <div class="d-flex justify-content-center gap-3">
        <button class="btn btn-primary px-4 py-2" style="font-size: 1.05rem;">{{ props?.btnPrimaryText || 'Launch Now' }}</button>
        <button class="btn btn-outline-light px-4 py-2" style="font-size: 1.05rem;">{{ props?.btnSecondaryText || 'Inspect Kernel' }}</button>
      </div>
    </div>
  </div>
</template>
`,
          });
        } else {
          files.push({
            path: `src/components/${compName}.vue`,
            language: 'vue',
            content: `<script setup lang="ts">
const props = defineProps<{
  props?: {
    sectionTitle?: string;
    cards?: Array<{ title: string; desc: string; icon?: string; badge?: string }>;
  }
}>();
</script>

<template>
  <div class="vue-feature-grid py-3">
    <h2 class="text-center mb-4" style="font-size: 2.2rem; font-weight: 800; color: var(--bs-primary);">
      {{ props?.sectionTitle || 'Interactive Feature Showcase' }}
    </h2>
    <div class="row gap-3 justify-content-center">
      <div v-for="(card, i) in props?.cards || []" :key="i" class="col-12 col-md-4 card" style="flex: 1 1 300px;">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span style="font-size: 2.2rem;">{{ card.icon || '🚀' }}</span>
          <span v-if="card.badge" class="badge bg-primary">{{ card.badge }}</span>
        </div>
        <h3 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 0.75rem;">{{ card.title }}</h3>
        <p class="text-muted" style="font-size: 0.95rem; line-height: 1.6;">{{ card.desc }}</p>
      </div>
    </div>
  </div>
</template>
`,
          });
        }
      } else if (block.framework === 'svelte') {
        // Generate Svelte 5 Component
        const compName = `Block${index}_${block.type}`;
        imports.push(`import ${compName} from '../components/${compName}.svelte';`);
        const clientAttr = block.islandHydration !== 'static' ? ` ${block.islandHydration}` : '';
        pageBlocks.push(`    <div class="${block.colSpan} ${block.padding}">\n      <${compName}${clientAttr} props={${JSON.stringify(block.props)}} />\n    </div>`);

        files.push({
          path: `src/components/${compName}.svelte`,
          language: 'svelte',
          content: `<script lang="ts">
  let { props = {} } = $props();
  let isYearly = $state(false);
  let sectionTitle = $derived(props.sectionTitle || 'Transparent High-Octane Pricing');
  let discountBadge = $derived(props.monthlyDiscount || 'Save 25%');
  let tiers = $derived(props.tiers || []);
</script>

<div class="svelte-pricing-table py-3">
  <div class="text-center mb-5">
    <h2 style="font-size: 2.2rem; font-weight: 800; margin-bottom: 1rem; color: var(--bs-primary);">{sectionTitle}</h2>
    <div class="d-flex justify-content-center align-items-center gap-3">
      <span class={!isYearly ? 'text-light fw-bold' : 'text-muted'}>Monthly Billing</span>
      <button 
        class="btn btn-outline-light py-1 px-3" 
        style="border-radius: 50rem; border-color: var(--bs-primary); background: {isYearly ? 'var(--bs-primary)' : 'transparent'}; color: #fff;"
        onclick={() => isYearly = !isYearly}
      >
        {isYearly ? 'Yearly Active' : 'Switch to Yearly'}
      </button>
      <span class="badge bg-success">{discountBadge}</span>
    </div>
  </div>

  <div class="row gap-4 justify-content-center">
    {#each tiers as tier}
      <div class="col-12 col-md-4 card {tier.highlight ? 'border-primary' : ''}" style="flex: 1 1 320px; {tier.highlight ? 'box-shadow: 0 0 30px rgba(0,220,130,0.25); border-width: 2px;' : ''}">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 style="font-size: 1.4rem; font-weight: 800; margin: 0;">{tier.name}</h3>
          {#if tier.highlight}
            <span class="badge bg-primary">RECOMMENDED</span>
          {/if}
        </div>
        <div style="font-size: 2.6rem; font-weight: 900; color: var(--bs-primary); margin-bottom: 0.5rem;">
          {isYearly ? tier.priceYearly : tier.priceMonthly}
        </div>
        <p class="text-muted mb-4" style="min-height: 48px;">{tier.desc}</p>
        <ul style="list-style: none; padding: 0; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 0.75rem;">
          {#each tier.features as feat}
            <li class="d-flex align-items-center gap-2">
              <span class="text-success">✓</span>
              <span>{feat}</span>
            </li>
          {/each}
        </ul>
        <button class="btn {tier.highlight ? 'btn-primary' : 'btn-outline-light'} w-100 py-2">Select {tier.name}</button>
      </div>
    {/each}
  </div>
</div>
`,
        });
      }
    });

    // 5. src/pages/index.astro
    files.push({
      path: 'src/pages/index.astro',
      language: 'astro',
      content: `---
// WE-FAST Generated Astro Hybrid Page
import '../styles/bootstrap.css';
${imports.join('\n')}
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${template.name}</title>
  <meta name="description" content="${template.description}" />
</head>
<body>
  <div class="container py-4">
${pageBlocks.join('\n\n')}
  </div>
</body>
</html>
`,
    });

    return files;
  }

  /**
   * Export to Nuxt 4 / Vue 3 Project
   */
  public static generateNuxtProject(template: WeFastSiteTemplate): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    files.push({
      path: 'package.json',
      language: 'json',
      content: JSON.stringify(
        {
          name: `${template.id}-nuxt-site`,
          type: 'module',
          version: '1.0.0',
          scripts: { dev: 'nuxt dev', build: 'nuxt build', generate: 'nuxt generate' },
          dependencies: { nuxt: '^3.13.0', vue: '^3.5.0' },
        },
        null,
        2
      ),
    });

    files.push({
      path: 'nuxt.config.ts',
      language: 'typescript',
      content: `export default defineNuxtConfig({
  css: ['~/assets/css/bootstrap.css'],
  compatibilityDate: '2026-07-14',
});
`,
    });

    files.push({
      path: 'assets/css/bootstrap.css',
      language: 'css',
      content: BootstrapGenerator.generateCSS(template.themeKey),
    });

    const compRefs: string[] = [];
    template.blocks.forEach((block, idx) => {
      const name = `Block${idx}_${block.type}`;
      compRefs.push(`    <${name} :props="${JSON.stringify(block.props).replace(/"/g, "'")}" class="${block.colSpan} ${block.padding}" />`);
      files.push({
        path: `components/${name}.vue`,
        language: 'vue',
        content: `<script setup lang="ts">
const props = defineProps<{ props?: any }>();
</script>
<template>
  <div class="card p-4">
    <h3>{{ props?.sectionTitle || props?.heading || '${block.title}' }}</h3>
    <p class="text-muted">{{ props?.subheading || '${block.description}' }}</p>
  </div>
</template>`,
      });
    });

    files.push({
      path: 'app.vue',
      language: 'vue',
      content: `<template>
  <div class="container py-4">
${compRefs.join('\n')}
  </div>
</template>`,
    });

    return files;
  }

  /**
   * Export to Svelte / SvelteKit Project
   */
  public static generateSvelteProject(template: WeFastSiteTemplate): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    files.push({
      path: 'package.json',
      language: 'json',
      content: JSON.stringify(
        {
          name: `${template.id}-svelte-site`,
          type: 'module',
          version: '1.0.0',
          scripts: { dev: 'vite dev', build: 'vite build' },
          dependencies: { svelte: '^5.0.0' },
        },
        null,
        2
      ),
    });

    files.push({
      path: 'src/app.css',
      language: 'css',
      content: BootstrapGenerator.generateCSS(template.themeKey),
    });

    const imports: string[] = [];
    const blockCalls: string[] = [];
    template.blocks.forEach((block, idx) => {
      const name = `Block${idx}_${block.type}`;
      imports.push(`import ${name} from './components/${name}.svelte';`);
      blockCalls.push(`    <div class="${block.colSpan} ${block.padding}"><${name} props={${JSON.stringify(block.props)}} /></div>`);
      files.push({
        path: `src/components/${name}.svelte`,
        language: 'svelte',
        content: `<script lang="ts">
  let { props = {} } = $props();
</script>
<div class="card p-4">
  <h3>{props.sectionTitle || props.heading || '${block.title}'}</h3>
  <p class="text-muted">{props.subheading || '${block.description}'}</p>
</div>`,
      });
    });

    files.push({
      path: 'src/App.svelte',
      language: 'svelte',
      content: `<script lang="ts">
  import './app.css';
${imports.join('\n')}
</script>
<main class="container py-4">
${blockCalls.join('\n')}
</main>`,
    });

    return files;
  }

  /**
   * Export to Static HTML + Bootstrap 5 + GFX Bundle (Single/Clean deployable bundle)
   */
  public static generateStaticHtml(template: WeFastSiteTemplate): GeneratedFile[] {
    const css = BootstrapGenerator.generateCSS(template.themeKey);
    const htmlBlocks: string[] = [];

    template.blocks.forEach((block) => {
      if (block.type === 'BootstrapNavbar') {
        htmlBlocks.push(`  <header class="navbar ${block.colSpan} ${block.padding}">
    <a href="#" class="navbar-brand">
      <span>${block.props.brandName || 'WE-FAST'}</span>
      <span class="badge bg-primary">${block.props.brandBadge || 'v1'}</span>
    </a>
    <nav class="d-flex gap-3 align-items-center">
      ${(block.props.links || []).map((l: string) => `<a href="#" class="btn btn-outline-light py-1">${l}</a>`).join('\n      ')}
      <a href="#" class="btn btn-primary">${block.props.ctaText || 'Get Started'}</a>
    </nav>
  </header>`);
      } else if (block.type === 'GfxCyberHero') {
        htmlBlocks.push(`  <div class="card text-center py-5 position-relative ${block.colSpan} ${block.padding}" style="min-height: 480px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
    <canvas id="gfx-canvas-${block.id}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0.85;"></canvas>
    <div style="position: relative; z-index: 2; max-width: 760px; margin: 0 auto; padding: 2rem;">
      <h1 style="font-size: 2.8rem; font-weight: 900; margin-bottom: 1.2rem; background: linear-gradient(135deg, #fff 0%, var(--bs-primary) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
        ${block.props.heading || 'GFX Cyber Hero'}
      </h1>
      <p class="text-light mb-4" style="font-size: 1.2rem; opacity: 0.9;">
        ${block.props.subheading || 'Driven by Direct3D12/WebGL inspired shader reflection.'}
      </p>
      <div class="d-flex justify-content-center gap-3">
        <a href="#" class="btn btn-primary px-4 py-2">${block.props.btnPrimaryText || 'Deploy Now'}</a>
        <a href="#" class="btn btn-outline-light px-4 py-2">${block.props.btnSecondaryText || 'Inspect Shaders'}</a>
      </div>
    </div>
  </div>`);
      } else if (block.type === 'NuxtFeatureGrid') {
        htmlBlocks.push(`  <div class="py-4 ${block.colSpan} ${block.padding}">
    <h2 class="text-center mb-4" style="font-size: 2.2rem; font-weight: 800; color: var(--bs-primary);">${block.props.sectionTitle || 'Features'}</h2>
    <div class="row gap-3 justify-content-center">
      ${(block.props.cards || [])
        .map(
          (c: any) => `
      <div class="col-12 col-md-4 card" style="flex: 1 1 300px;">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span style="font-size: 2.2rem;">${c.icon || '🚀'}</span>
          ${c.badge ? `<span class="badge bg-primary">${c.badge}</span>` : ''}
        </div>
        <h3 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 0.75rem;">${c.title}</h3>
        <p class="text-muted" style="font-size: 0.95rem;">${c.desc}</p>
      </div>`
        )
        .join('')}
    </div>
  </div>`);
      } else if (block.type === 'SveltePricingTable') {
        htmlBlocks.push(`  <div class="py-4 ${block.colSpan} ${block.padding}">
    <div class="text-center mb-5">
      <h2 style="font-size: 2.2rem; font-weight: 800; margin-bottom: 1rem; color: var(--bs-primary);">${block.props.sectionTitle || 'Pricing'}</h2>
      <span class="badge bg-success">${block.props.monthlyDiscount || 'Save 25%'}</span>
    </div>
    <div class="row gap-4 justify-content-center">
      ${(block.props.tiers || [])
        .map(
          (t: any) => `
      <div class="col-12 col-md-4 card ${t.highlight ? 'border-primary' : ''}" style="flex: 1 1 320px; ${t.highlight ? 'box-shadow: 0 0 30px rgba(0,220,130,0.25); border-width: 2px;' : ''}">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 style="font-size: 1.4rem; font-weight: 800; margin: 0;">${t.name}</h3>
          ${t.highlight ? `<span class="badge bg-primary">RECOMMENDED</span>` : ''}
        </div>
        <div style="font-size: 2.6rem; font-weight: 900; color: var(--bs-primary); margin-bottom: 0.5rem;">${t.priceMonthly}</div>
        <p class="text-muted mb-4">${t.desc}</p>
        <button class="btn ${t.highlight ? 'btn-primary' : 'btn-outline-light'} w-100 py-2">Select ${t.name}</button>
      </div>`
        )
        .join('')}
    </div>
  </div>`);
      } else {
        htmlBlocks.push(`  <footer class="text-center py-4 ${block.colSpan} ${block.padding}">
    <p class="text-muted">&copy; ${block.props.copyrightYear || '2026'} ${block.props.companyName || 'WE-FAST'}. All rights reserved.</p>
    <p class="text-secondary" style="font-size: 0.85rem;">${block.props.tagline || 'Powered by WE-FAST Engine'}</p>
  </footer>`);
      }
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${template.name}</title>
  <meta name="description" content="${template.description}" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="container py-4">
${htmlBlocks.join('\n\n')}
  </div>
  <script src="gfx-engine.js"></script>
</body>
</html>`;

    const jsContent = `/* WE-FAST Embedded GFX Engine & Runtime Shader Animator */
(function() {
  const canvases = document.querySelectorAll('canvas[id^="gfx-canvas-"]');
  canvases.forEach(canvas => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let time = 0;
    function render() {
      time += 0.02;
      const w = ctx.canvas.width = canvas.clientWidth || 800;
      const h = ctx.canvas.height = canvas.clientHeight || 450;
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = '#050714';
      ctx.fillRect(0, 0, w, h);
      const rings = 20;
      for (let i = rings; i >= 1; i--) {
        const r = ((time * 70 + i * (Math.max(w, h) / rings)) % Math.max(w, h)) * 0.7;
        const alpha = Math.max(0.1, (1 - r / Math.max(w, h)) * 0.9);
        const hue = (time * 60 + i * 15) % 360;
        ctx.beginPath();
        ctx.arc(cx + Math.sin(time + i*0.2)*20, cy + Math.cos(time + i*0.2)*20, r, 0, Math.PI * 2);
        ctx.strokeStyle = \`hsla(\${hue}, 85%, 60%, \${alpha})\`;
        ctx.lineWidth = Math.max(1.5, r / 70);
        ctx.stroke();
      }
      requestAnimationFrame(render);
    }
    render();
  });
})();`;

    return [
      { path: 'index.html', language: 'html', content: htmlContent },
      { path: 'style.css', language: 'css', content: css },
      { path: 'gfx-engine.js', language: 'javascript', content: jsContent },
    ];
  }
}
