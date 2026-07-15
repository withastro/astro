# ⚡ WE-FAST — Multi-Framework Website Creator & Visual Studio

**WE-FAST** (*Perfect and easy to use, with lots of options!*) is an ultra-high performance, multi-framework website creation platform engineered inside the `kariitsme/astro` repository. It combines the core architectural strengths and technologies of **five major open-source repositories**:

1. **[kariitsme/astro](https://github.com/kariitsme/astro)** (*Astro Web Framework*):
   Provides the unifying **Island Architecture (`client:load`, `client:visible`, `client:idle`)** and multi-framework compiler that hosts both static HTML/zero-JS components and dynamic reactive widgets from Vue and Svelte.
2. **[kariitsme/nuxt](https://github.com/kariitsme/nuxt)** (*Nuxt & Vue 3 Full-Stack Framework*):
   Powers reactive state management, composition API components (`<script setup lang="ts">`), feature grids, data-fetching cards, and full Nuxt 4/Vue 3 export targets.
3. **[kariitsme/bootstrap](https://github.com/kariitsme/bootstrap)** (*Bootstrap 5 Responsive HTML/CSS/JS Framework*):
   Delivers the mobile-first 12-column grid (`col-12`, `col-lg-6`, `col-lg-4`, `row`), utility classes (`d-flex`, `py-5`, `justify-content-between`), and design tokens (`--bs-primary`, `--bs-dark`, etc.) across 5 customizable color themes (`Cyber Neon`, `Indigo SaaS`, `Emerald Eco`, `Bistro Warm`, and `Bootstrap Blue`).
4. **[kariitsme/svelte](https://github.com/kariitsme/svelte)** (*Svelte Surgical DOM Compiler*):
   Delivers ultra-lightweight compiled reactive components (`+page.svelte`), interactive pricing switchers, and surgical DOM updates with zero virtual DOM overhead.
5. **[kariitsme/gfx](https://github.com/kariitsme/gfx)** (*GFX Minimalist Graphics & Shader API*):
   Integrated as the **WE-FAST GFX Engine (`gfx-engine.ts`)** with features like **Full Shader Reflection**, **Runtime Shader Reloading (`gfxKernelReloadAll()`)**, **Garbage Collection simulation**, **DXR-1.1 Inline Raytracing (`RayQuery<>`)**, and high-speed WebGL/Canvas visual effects (raymarched cyber tunnels, glowing spheres, neon liquid waves, and 3D particle mesh networks).

---

## 🏗️ Architecture & Core Components

WE-FAST is structured cleanly within the `kariitsme/astro` monorepo:

```text
/home/user/astro/
├── packages/we-fast/               # Core Engine, SDK & CLI (`@we-fast/core` / `we-fast`)
│   ├── bin/we-fast.mjs             # Executable CLI (`we-fast`)
│   ├── src/gfx-engine.ts           # D3D12/HLSL/WebGL inspired reflection & shader engine
│   ├── src/bootstrap-system.ts     # Bootstrap 5 Design System & 12-column Grid Generator
│   ├── src/code-generators.ts      # Multi-Framework Export Engine (Astro, Nuxt, Svelte, HTML)
│   ├── src/templates/index.ts      # 6 Pre-configured Multi-Framework Website Templates
│   └── src/index.ts                # Programmatic SDK Entry Point
├── examples/we-fast/               # Live Visual Studio & Creator Web Application (`@example/we-fast`)
│   ├── astro.config.mjs            # Astro configuration supporting @astrojs/vue & @astrojs/svelte
│   ├── src/pages/index.astro       # Studio entry page
│   └── src/components/WeFastStudio.vue # Full Drag & Drop Visual Creator GUI
└── we-fast/                        # Top-level Documentation & CLI Shortcut
    ├── README.md
    └── bin/we-fast -> ../../packages/we-fast/bin/we-fast.mjs
```

---

## 🌟 Built-in Templates & Presets ("Lots of options!")

WE-FAST includes 6 complete, production-ready website templates out of the box:

1. **`saas-ai` — SaaS AI Platform (`WE-FAST AI`)**:
   - Cyber Neon theme (`#00DC82`), GFX raymarched cyber-tunnel hero, Nuxt/Vue feature showcase, Svelte reactive annual/monthly pricing table, and static Astro footer.
2. **`ecommerce-nextgen` — Modern E-Commerce Store (`NextGen Goods`)**:
   - Indigo SaaS theme (`#6366f1`), DXR inline raytraced product hologram hero, Vue 3 quick-add product grid, and Bootstrap shopping navbar.
3. **`agency-3d` — Creative Agency & 3D Portfolio (`Studio GFX`)**:
   - Emerald Eco theme (`#059669`), interactive 3D particle mesh network hero (`gfx-engine`), and Vue agency impact metrics.
4. **`crypto-defi` — Crypto & Web3 Landing (`DeFi Pulse`)**:
   - Cyber Neon theme, procedural glowing liquid sine waves hero, Svelte staking APY calculator, and wallet connect header.
5. **`docs-portal` — Developer Documentation Portal (`NuxtAstro Docs`)**:
   - Clean Bootstrap Blue theme, quick-search trigger, architecture guides grid, and technical documentation headers.
6. **`bistro-warm` — Restaurant & Hospitality (`Bistro 5`)**:
   - Warm ambient gold theme (`#d97706`), chef signature menu selection cards in Vue, and reservation CTA header.

---

## ⚡ Quick Start & CLI Usage

Run the `we-fast` CLI directly from the terminal to scaffold or compile multi-framework websites in seconds:

### 1. List Available Templates
```bash
node ./packages/we-fast/bin/we-fast.mjs list
```

### 2. Generate a Website Project
Export any template to your preferred framework (`astro`, `nuxt`, `svelte`, or standalone `html`):

```bash
# Export to pure static HTML + Bootstrap CSS + GFX Engine (No node build required!)
node ./packages/we-fast/bin/we-fast.mjs generate saas-ai --target html --outDir ./my-static-site

# Export to an Astro Hybrid Project (combining Astro + Vue + Svelte + Bootstrap + GFX)
node ./packages/we-fast/bin/we-fast.mjs generate saas-ai --target astro --outDir ./my-astro-site

# Export to a Nuxt 4 / Vue 3 Project
node ./packages/we-fast/bin/we-fast.mjs generate ecommerce-nextgen --target nuxt --outDir ./my-nuxt-store

# Export to a Svelte / SvelteKit Project
node ./packages/we-fast/bin/we-fast.mjs generate crypto-defi --target svelte --outDir ./my-svelte-app
```

---

## 🎨 WE-FAST Visual Studio Web Application

Launch the live drag-and-drop / click-to-add Visual Studio directly in your browser:

```bash
cd examples/we-fast
pnpm dev --port 4321
```
*(Or build & preview statically via `pnpm build && pnpm preview`)*

### Studio Capabilities:
- **Responsive Viewport Switcher**: Instantly toggle between `💻 Desktop (100%)`, `📱 Tablet (768px)`, and `📲 Mobile (375px)`.
- **Bootstrap Grid Overlay**: Toggle `📐 Show Grid` to visualize 12-column spans (`col-12`, `col-lg-8`, `col-lg-6`, `col-lg-4`) directly over every component.
- **Component Palette**: Filter components by category or framework (`Astro 🏝️`, `Vue 💚`, `Svelte 🔥`, `Bootstrap 📐`, `GFX 🎨`). Click **`+ Add Block`** to append blocks.
- **Live Canvas Reordering**: Move blocks up/down, duplicate (`📄`), or delete (`🗑️`) right on the canvas.
- **Properties & Options Inspector**: Customize titles, subheadings, primary/secondary buttons, column spans, padding (`py-1` to `py-5`), and hydration strategies (`client:load`, `client:visible`, `static`).
- **Real-Time GFX Shader Controls**: When any GFX block is selected, adjust sliders for:
  - `Speed` (`0.2x` to `3.0x`)
  - `Color Hue Speed` (`0.2x` to `4.0x`)
  - `Density / Rings / Spheres` (`6` to `45`)
  - `Bloom / Glow Intensity` (`0.2` to `2.0`)
  - Click **`⚡ Reload Shaders`** to trigger live runtime kernel reloading (`gfxKernelReloadAll()`).
- **Multi-Framework Export Modal**: View exact generated code for Astro, Nuxt/Vue, Svelte, or Static HTML, copy to clipboard, or click **`⚡ Download Single-File HTML`** to save your customized page as an instant deployable `.html` file!

---

## 💡 Programmatic SDK Example (`WeFastEngine`)

```typescript
import { WeFastEngine } from 'we-fast';

// 1. Get a template
const template = WeFastEngine.getTemplate('saas-ai');

// 2. Export to Astro AST / Files
const astroFiles = WeFastEngine.exportProject(template!, 'astro');

// 3. Or export to pure Svelte 5 files
const svelteFiles = WeFastEngine.exportProject(template!, 'svelte');
```
