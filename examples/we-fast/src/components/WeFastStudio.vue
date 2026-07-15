<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, nextTick } from 'vue';
import { WE_FAST_TEMPLATES, WeFastEngine, type WeFastComponentBlock, type WeFastSiteTemplate } from 'we-fast';

// Studio State
const currentTemplateId = ref('saas-ai');
const viewportWidth = ref<'100%' | '768px' | '375px'>('100%');
const showGridOverlay = ref(false);
const isEditMode = ref(true);
const selectedBlockId = ref<string | null>(null);
const showCodeModal = ref(false);
const codeTab = ref<'astro' | 'nuxt' | 'svelte' | 'html'>('astro');
const copyFeedback = ref('');

// Load template into reactive state
const siteConfig = reactive<{
  name: string;
  description: string;
  themeKey: 'cyberNeon' | 'indigoSaaS' | 'emeraldEco' | 'bistroWarm' | 'default';
  blocks: WeFastComponentBlock[];
}>({
  name: 'SaaS AI Platform (WE-FAST AI)',
  description: 'High-octane cyber-themed AI developer platform with GFX raymarched tunnel, Nuxt terminal demo, and Svelte interactive tabs.',
  themeKey: 'cyberNeon',
  blocks: []
});

function loadTemplate(templateId: string) {
  const tmpl = WE_FAST_TEMPLATES.find(t => t.id === templateId) || WE_FAST_TEMPLATES[0];
  currentTemplateId.value = tmpl.id;
  siteConfig.name = tmpl.name;
  siteConfig.description = tmpl.description;
  siteConfig.themeKey = tmpl.themeKey;
  // Deep copy blocks
  siteConfig.blocks = JSON.parse(JSON.stringify(tmpl.blocks));
  if (siteConfig.blocks.length > 0) {
    selectedBlockId.value = siteConfig.blocks[1]?.id || siteConfig.blocks[0]?.id || null;
  }
}

onMounted(() => {
  loadTemplate('saas-ai');
});

// Component Palette Items for quick addition
const paletteItems: WeFastComponentBlock[] = [
  {
    id: 'palette-nav',
    type: 'BootstrapNavbar',
    category: 'navigation',
    framework: 'bootstrap',
    title: 'Bootstrap Header Navbar',
    description: 'Sleek navbar with brand, links, and CTA.',
    colSpan: 'col-12',
    padding: 'py-2',
    islandHydration: 'static',
    props: { brandName: 'New Project', brandBadge: 'BETA', links: ['Home', 'Features', 'Pricing', 'Contact'], ctaText: 'Get Started' }
  },
  {
    id: 'palette-hero-gfx',
    type: 'GfxCyberHero',
    category: 'hero',
    framework: 'gfx',
    title: 'GFX Interactive Shader Hero',
    description: 'Direct3D/WebGL raymarched cyber tunnel or inline raytracer.',
    colSpan: 'col-12',
    padding: 'py-5',
    islandHydration: 'client:load',
    props: { heading: 'Quantum Velocity Architecture', subheading: 'Combining Nuxt, Bootstrap, Svelte, and GFX into Astro Island perfection.', btnPrimaryText: 'Launch Project', btnSecondaryText: 'Inspect AST' },
    gfxOptions: { shaderType: 'cyber-tunnel', speed: 1.2, colorSpeed: 1.5, density: 24, bloom: 0.9 }
  },
  {
    id: 'palette-features',
    type: 'NuxtFeatureGrid',
    category: 'features',
    framework: 'vue',
    title: 'Nuxt / Vue Feature Showcase Grid',
    description: '3-col Bootstrap cards with reactive state.',
    colSpan: 'col-12',
    padding: 'py-5',
    islandHydration: 'client:visible',
    props: {
      sectionTitle: 'Core Capabilities',
      cards: [
        { title: 'Lightning Fast Island Hydration', desc: 'Selective interactive islands inside pure zero-JS HTML.', icon: '⚡', badge: 'Fast' },
        { title: 'Responsive Bootstrap 5 Grid', desc: '12-column mobile-first layout with instant spacing variables.', icon: '📐', badge: 'Responsive' },
        { title: 'GFX Shader Reflection', desc: 'High-speed GPU graphics simulation right in the browser canvas.', icon: '🎨', badge: 'Graphics' }
      ]
    }
  },
  {
    id: 'palette-pricing',
    type: 'SveltePricingTable',
    category: 'pricing',
    framework: 'svelte',
    title: 'Svelte Reactive Pricing Table',
    description: 'Smooth toggle between monthly and yearly billing options.',
    colSpan: 'col-12',
    padding: 'py-5',
    islandHydration: 'client:visible',
    props: {
      sectionTitle: 'Choose Your Plan',
      monthlyDiscount: 'Save 20% Annually',
      tiers: [
        { name: 'Starter', priceMonthly: '$15', priceYearly: '$12', desc: 'For personal projects.', features: ['3 Sites', 'Bootstrap Grid', 'Standard Shaders'] },
        { name: 'Pro Studio', priceMonthly: '$39', priceYearly: '$29', desc: 'For professional developers.', features: ['Unlimited Sites', 'Custom GFX Shaders', 'Multi-Framework Export'], highlight: true },
        { name: 'Enterprise', priceMonthly: '$149', priceYearly: '$119', desc: 'Dedicated cluster.', features: ['Custom AST Plugins', 'White-label Studio', '24/7 SLA'] }
      ]
    }
  },
  {
    id: 'palette-footer',
    type: 'AstroFooter',
    category: 'footer',
    framework: 'astro',
    title: 'Astro Static Hybrid Footer',
    description: 'Zero-JS static footer block.',
    colSpan: 'col-12',
    padding: 'py-4',
    islandHydration: 'static',
    props: { companyName: 'WE-FAST Inc.', copyrightYear: '2026', tagline: 'Built with kariitsme/astro multi-framework architecture.' }
  }
];

const selectedCategory = ref<string>('All');
const selectedFramework = ref<string>('All');

const filteredPalette = computed(() => {
  return paletteItems.filter(item => {
    const matchCat = selectedCategory.value === 'All' || item.category === selectedCategory.value.toLowerCase();
    const matchFw = selectedFramework.value === 'All' || item.framework.toLowerCase() === selectedFramework.value.toLowerCase();
    return matchCat && matchFw;
  });
});

function addBlock(item: WeFastComponentBlock) {
  const newBlock: WeFastComponentBlock = JSON.parse(JSON.stringify(item));
  newBlock.id = `block_${Math.random().toString(36).substring(2, 9)}`;
  siteConfig.blocks.push(newBlock);
  selectedBlockId.value = newBlock.id;
}

function removeBlock(index: number) {
  const removed = siteConfig.blocks.splice(index, 1)[0];
  if (selectedBlockId.value === removed?.id) {
    selectedBlockId.value = siteConfig.blocks[0]?.id || null;
  }
}

function moveBlock(index: number, direction: -1 | 1) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= siteConfig.blocks.length) return;
  const temp = siteConfig.blocks[index];
  siteConfig.blocks[index] = siteConfig.blocks[targetIndex];
  siteConfig.blocks[targetIndex] = temp;
}

function duplicateBlock(index: number) {
  const orig = siteConfig.blocks[index];
  const copy = JSON.parse(JSON.stringify(orig));
  copy.id = `block_${Math.random().toString(36).substring(2, 9)}`;
  siteConfig.blocks.splice(index + 1, 0, copy);
  selectedBlockId.value = copy.id;
}

const selectedBlock = computed(() => {
  if (!selectedBlockId.value) return null;
  return siteConfig.blocks.find(b => b.id === selectedBlockId.value) || null;
});

// GFX Shader Canvas Renderer Loop
const canvasRefs = ref<Record<string, HTMLCanvasElement>>({});
const animIds: Record<string, number> = {};

function setCanvasRef(el: any, blockId: string) {
  if (el) {
    canvasRefs.value[blockId] = el as HTMLCanvasElement;
    startGfxRenderer(blockId);
  } else {
    if (animIds[blockId]) {
      cancelAnimationFrame(animIds[blockId]);
      delete animIds[blockId];
    }
    delete canvasRefs.value[blockId];
  }
}

function startGfxRenderer(blockId: string) {
  if (animIds[blockId]) cancelAnimationFrame(animIds[blockId]);
  
  const renderLoop = () => {
    const canvas = canvasRefs.value[blockId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const block = siteConfig.blocks.find(b => b.id === blockId);
    if (!block || block.type !== 'GfxCyberHero' || !block.gfxOptions) return;
    
    const w = ctx.canvas.width = canvas.clientWidth || 800;
    const h = ctx.canvas.height = canvas.clientHeight || 450;
    const cx = w / 2, cy = h / 2;
    const time = (Date.now() / 1000) * block.gfxOptions.speed;
    const cSpeed = block.gfxOptions.colorSpeed;
    const density = Math.floor(block.gfxOptions.density);
    const bloom = block.gfxOptions.bloom;
    
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#050714';
    ctx.fillRect(0, 0, w, h);
    
    if (block.gfxOptions.shaderType === 'cyber-tunnel') {
      for (let i = density; i >= 1; i--) {
        const r = ((time * 65 + i * (Math.max(w, h) / density)) % Math.max(w, h)) * 0.7;
        const alpha = Math.max(0.1, Math.min(1.0, (1 - r / Math.max(w, h)) * bloom));
        const hue = (time * 50 * cSpeed + i * 15) % 360;
        ctx.beginPath();
        ctx.arc(cx + Math.sin(time + i*0.2)*18, cy + Math.cos(time + i*0.2)*18, r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue}, 85%, 60%, ${alpha})`;
        ctx.lineWidth = Math.max(1.5, (r / 70) * bloom);
        ctx.stroke();
      }
    } else if (block.gfxOptions.shaderType === 'inline-raytracer') {
      const count = Math.min(16, Math.floor(density / 2));
      for (let i = 0; i < count; i++) {
        const sx = ((Math.sin(time * 0.5 + i * 1.3) * 0.4 + 0.5) * w);
        const sy = ((Math.cos(time * 0.4 + i * 1.7) * 0.35 + 0.5) * h);
        const sr = 28 + Math.sin(time + i) * 12;
        const hue = (i * 35 + time * 40 * cSpeed) % 360;
        
        const grad = ctx.createRadialGradient(sx - sr*0.3, sy - sr*0.3, sr*0.1, sx, sy, sr);
        grad.addColorStop(0, `hsla(${hue}, 100%, 85%, 1.0)`);
        grad.addColorStop(0.6, `hsla(${hue}, 90%, 55%, ${0.8 * bloom})`);
        grad.addColorStop(1, `hsla(${hue}, 90%, 20%, 0.0)`);
        
        ctx.beginPath();
        ctx.arc(sx, sy, sr * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        
        if (i > 0) {
          const prevX = ((Math.sin(time * 0.5 + (i - 1) * 1.3) * 0.4 + 0.5) * w);
          const prevY = ((Math.cos(time * 0.4 + (i - 1) * 1.7) * 0.35 + 0.5) * h);
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${0.3 * bloom})`;
          ctx.lineWidth = 2 * bloom;
          ctx.stroke();
        }
      }
    } else if (block.gfxOptions.shaderType === 'neon-waves') {
      const lines = density;
      for (let i = 0; i < lines; i++) {
        ctx.beginPath();
        const hue = (i * 12 + time * 45 * cSpeed) % 360;
        const yOffset = (h / lines) * i;
        for (let x = 0; x <= w; x += 15) {
          const y = yOffset + Math.sin(x * 0.01 + time * 2 + i * 0.4) * 30 * bloom + Math.cos(x * 0.02 - time) * 15;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsla(${hue}, 85%, 60%, ${0.65 * bloom})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    } else if (block.gfxOptions.shaderType === 'particle-mesh') {
      const count = Math.min(45, Math.floor(density * 1.4));
      const pts: { x: number; y: number; z: number }[] = [];
      for (let i = 0; i < count; i++) {
        pts.push({
          x: (Math.sin(time * 0.3 + i * 2.1) * 0.4 + 0.5) * w,
          y: (Math.cos(time * 0.4 + i * 3.3) * 0.4 + 0.5) * h,
          z: (Math.sin(time + i) * 0.5 + 0.5) * 100
        });
      }
      pts.forEach((p, idx) => {
        const hue = (idx * 10 + time * 35 * cSpeed) % 360;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(2, (1 - p.z / 150) * 6 * bloom), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 90%, 65%, 0.9)`;
        ctx.fill();
        for (let j = idx + 1; j < pts.length; j++) {
          const p2 = pts[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${(1 - dist / 110) * 0.4 * bloom})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });
    }
    
    animIds[blockId] = requestAnimationFrame(renderLoop);
  };
  renderLoop();
}

// Runtime Shader Reloading Simulation (`gfxKernelReloadAll`)
function reloadGfxKernel(block: WeFastComponentBlock) {
  if (!block.gfxOptions) return;
  // Briefly pulse bloom to simulate runtime kernel re-compile
  const origBloom = block.gfxOptions.bloom;
  block.gfxOptions.bloom = 1.8;
  setTimeout(() => {
    if (block.gfxOptions) block.gfxOptions.bloom = origBloom;
  }, 250);
}

// Code Generator Computation
const generatedCodeMap = computed(() => {
  const dummyTmpl: WeFastSiteTemplate = {
    id: currentTemplateId.value,
    name: siteConfig.name,
    description: siteConfig.description,
    themeKey: siteConfig.themeKey,
    blocks: siteConfig.blocks
  };

  const astroFiles = WeFastEngine.exportProject(dummyTmpl, 'astro');
  const nuxtFiles = WeFastEngine.exportProject(dummyTmpl, 'nuxt');
  const svelteFiles = WeFastEngine.exportProject(dummyTmpl, 'svelte');
  const htmlFiles = WeFastEngine.exportProject(dummyTmpl, 'html');

  return {
    astro: astroFiles.map(f => `=== [${f.path}] ===\n${f.content}`).join('\n\n'),
    nuxt: nuxtFiles.map(f => `=== [${f.path}] ===\n${f.content}`).join('\n\n'),
    svelte: svelteFiles.map(f => `=== [${f.path}] ===\n${f.content}`).join('\n\n'),
    html: htmlFiles.map(f => `=== [${f.path}] ===\n${f.content}`).join('\n\n')
  };
});

function copyCurrentCode() {
  const text = generatedCodeMap.value[codeTab.value] || '';
  navigator.clipboard?.writeText(text);
  copyFeedback.value = '✓ Copied to clipboard!';
  setTimeout(() => copyFeedback.value = '', 2500);
}

function downloadSingleFileHtml() {
  const dummyTmpl: WeFastSiteTemplate = {
    id: currentTemplateId.value,
    name: siteConfig.name,
    description: siteConfig.description,
    themeKey: siteConfig.themeKey,
    blocks: siteConfig.blocks
  };
  const htmlFiles = WeFastEngine.exportProject(dummyTmpl, 'html');
  const htmlObj = htmlFiles.find(f => f.path === 'index.html');
  if (!htmlObj) return;
  
  const blob = new Blob([htmlObj.content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${siteConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="wefast-studio">
    <!-- Top Studio Navbar -->
    <header class="studio-header">
      <div class="d-flex align-items-center gap-3">
        <div class="d-flex align-items-center gap-2">
          <span style="font-size: 1.5rem; font-weight: 900; color: var(--bs-primary); letter-spacing: -0.5px;">WE-FAST</span>
          <span class="badge bg-primary" style="font-size: 0.7rem;">STUDIO v1.0</span>
        </div>
        <div class="d-flex align-items-center gap-1" style="background: rgba(255,255,255,0.05); padding: 3px; border-radius: 6px;">
          <button @click="viewportWidth = '100%'" :class="['btn py-1 px-2', viewportWidth === '100%' ? 'btn-primary' : 'btn-outline-light']" style="font-size: 0.8rem;">💻 Desktop</button>
          <button @click="viewportWidth = '768px'" :class="['btn py-1 px-2', viewportWidth === '768px' ? 'btn-primary' : 'btn-outline-light']" style="font-size: 0.8rem;">📱 Tablet</button>
          <button @click="viewportWidth = '375px'" :class="['btn py-1 px-2', viewportWidth === '375px' ? 'btn-primary' : 'btn-outline-light']" style="font-size: 0.8rem;">📲 Mobile</button>
        </div>
        <button @click="showGridOverlay = !showGridOverlay" :class="['btn py-1 px-3', showGridOverlay ? 'btn-primary' : 'btn-outline-light']" style="font-size: 0.82rem;">
          📐 {{ showGridOverlay ? 'Grid On (12-Col)' : 'Grid Off' }}
        </button>
      </div>

      <!-- Center Toolbar -->
      <div class="d-flex align-items-center gap-2">
        <label style="font-size: 0.82rem; color: #94a3b8; font-weight: 600;">Template Preset:</label>
        <select 
          :value="currentTemplateId" 
          @change="e => loadTemplate((e.target as HTMLSelectElement).value)"
          class="btn btn-outline-light py-1 px-2"
          style="background: rgba(30, 41, 59, 0.9); border-color: rgba(255,255,255,0.2); color: #fff; font-size: 0.85rem;"
        >
          <option v-for="tmpl in WE_FAST_TEMPLATES" :key="tmpl.id" :value="tmpl.id">
            {{ tmpl.name }}
          </option>
        </select>
        <select
          v-model="siteConfig.themeKey"
          class="btn btn-outline-light py-1 px-2"
          style="background: rgba(30, 41, 59, 0.9); border-color: rgba(255,255,255,0.2); color: #fff; font-size: 0.85rem;"
        >
          <option value="cyberNeon">🔮 Theme: Cyber Neon</option>
          <option value="indigoSaaS">⚡ Theme: Indigo SaaS</option>
          <option value="emeraldEco">🌿 Theme: Emerald Eco</option>
          <option value="bistroWarm">🍷 Theme: Bistro Warm</option>
          <option value="default">📐 Theme: Bootstrap Blue</option>
        </select>
      </div>

      <!-- Right Actions -->
      <div class="d-flex align-items-center gap-3">
        <button @click="isEditMode = !isEditMode" :class="['btn py-1 px-3', isEditMode ? 'btn-primary' : 'btn-outline-light']" style="font-size: 0.85rem;">
          {{ isEditMode ? '✏️ Edit Mode' : '👀 Preview Mode' }}
        </button>
        <button @click="showCodeModal = true" class="btn btn-outline-light py-1 px-3" style="font-size: 0.85rem; border-color: var(--bs-primary); color: var(--bs-primary);">
          📥 Export / Code
        </button>
        <button @click="downloadSingleFileHtml" class="btn btn-primary py-1 px-3" style="font-size: 0.85rem;">
          ⚡ Download HTML
        </button>
      </div>
    </header>

    <!-- Studio Body -->
    <div class="studio-body">
      <!-- Left Sidebar: Component Palette -->
      <aside class="studio-sidebar-left p-3">
        <div class="mb-3">
          <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--bs-primary); margin-bottom: 0.6rem;">Component Library</h3>
          <p class="text-muted mb-2" style="font-size: 0.78rem;">Click to add multi-framework components directly to your page.</p>
          
          <!-- Category Tabs -->
          <div class="d-flex flex-wrap gap-1 mb-2">
            <button v-for="cat in ['All', 'Navigation', 'Hero', 'Features', 'Pricing', 'Footer']" :key="cat"
              @click="selectedCategory = cat"
              :class="['btn py-1 px-2', selectedCategory === cat ? 'btn-primary' : 'btn-outline-light']"
              style="font-size: 0.75rem; flex: 1 1 auto;"
            >{{ cat }}</button>
          </div>
          <!-- Framework Filter -->
          <div class="d-flex flex-wrap gap-1 mb-3">
            <button v-for="fw in ['All', 'Astro', 'Vue', 'Svelte', 'Bootstrap', 'GFX']" :key="fw"
              @click="selectedFramework = fw"
              :class="['btn py-1 px-2', selectedFramework === fw ? 'btn-primary' : 'btn-outline-light']"
              style="font-size: 0.72rem;"
            >{{ fw }}</button>
          </div>
        </div>

        <!-- Palette List -->
        <div class="d-flex flex-column gap-2" style="overflow-y: auto; flex: 1;">
          <div v-for="item in filteredPalette" :key="item.id" 
            @click="addBlock(item)"
            class="card p-3" 
            style="cursor: pointer; border: 1px solid rgba(255,255,255,0.1); background: rgba(30,41,59,0.4);"
          >
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span style="font-size: 0.9rem; font-weight: 700; color: #fff;">{{ item.title }}</span>
              <span class="badge bg-primary" style="font-size: 0.68rem;">{{ item.framework.toUpperCase() }}</span>
            </div>
            <p class="text-muted mb-2" style="font-size: 0.75rem; line-height: 1.4;">{{ item.description }}</p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="badge" style="background: rgba(255,255,255,0.1); color: #cbd5e1; font-size: 0.65rem;">{{ item.islandHydration }}</span>
              <span class="text-success" style="font-size: 0.8rem; font-weight: bold;">+ Add Block</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Center Canvas: Live Page Preview -->
      <main class="studio-canvas-container">
        <div :class="['studio-viewport', showGridOverlay ? 'wefast-grid-overlay' : '']" :style="{ width: viewportWidth, maxWidth: '1280px' }">
          <div class="container py-4 row" style="margin: 0 auto; width: 100%;">
            <div v-for="(block, idx) in siteConfig.blocks" :key="block.id"
              @click="selectedBlockId = block.id"
              :class="[block.colSpan, block.padding]"
              :data-col="`${block.colSpan} [${block.framework.toUpperCase()}]`"
              style="position: relative; transition: all 0.2s ease;"
            >
              <!-- Edit Mode Block Outline & Controls Toolbar -->
              <div v-if="isEditMode" class="card p-2 mb-2 d-flex flex-row justify-content-between align-items-center"
                :style="{
                  background: selectedBlockId === block.id ? 'rgba(0, 220, 130, 0.15)' : 'rgba(15, 23, 42, 0.85)',
                  border: selectedBlockId === block.id ? '2px solid var(--bs-primary)' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }"
              >
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-primary">{{ block.framework.toUpperCase() }}</span>
                  <span style="font-size: 0.82rem; font-weight: 700; color: #fff;">{{ block.title }}</span>
                  <span class="badge" style="background: rgba(255,255,255,0.12); color: #cbd5e1; font-size: 0.65rem;">{{ block.colSpan }}</span>
                </div>
                <div class="d-flex align-items-center gap-1">
                  <button @click.stop="moveBlock(idx, -1)" :disabled="idx === 0" class="btn btn-outline-light py-1 px-2" style="font-size: 0.75rem;" title="Move Up">↑</button>
                  <button @click.stop="moveBlock(idx, 1)" :disabled="idx === siteConfig.blocks.length - 1" class="btn btn-outline-light py-1 px-2" style="font-size: 0.75rem;" title="Move Down">↓</button>
                  <button @click.stop="duplicateBlock(idx)" class="btn btn-outline-light py-1 px-2" style="font-size: 0.75rem;" title="Duplicate">📄</button>
                  <button @click.stop="removeBlock(idx)" class="btn btn-danger py-1 px-2" style="font-size: 0.75rem;" title="Delete">🗑️</button>
                </div>
              </div>

              <!-- Component Interactive Preview Rendering -->
              <div :style="{
                outline: isEditMode && selectedBlockId === block.id ? '2px solid var(--bs-primary)' : 'none',
                outlineOffset: '4px',
                borderRadius: '0.8rem'
              }">
                <!-- 1. Bootstrap Navbar -->
                <header v-if="block.type === 'BootstrapNavbar'" class="navbar w-100 py-2 px-3 card d-flex flex-row justify-content-between align-items-center">
                  <a href="#" class="navbar-brand d-flex align-items-center gap-2">
                    <span style="font-size: 1.35rem; font-weight: 800; color: var(--bs-primary);">{{ block.props.brandName || 'Brand' }}</span>
                    <span v-if="block.props.brandBadge" class="badge bg-primary">{{ block.props.brandBadge }}</span>
                  </a>
                  <nav class="d-flex gap-2 align-items-center flex-wrap">
                    <a v-for="link in (block.props.links || [])" :key="link" href="#" class="btn btn-outline-light py-1 px-3" style="font-size: 0.85rem;">{{ link }}</a>
                    <a v-if="block.props.ctaText" href="#" class="btn btn-primary py-1 px-3" style="font-size: 0.85rem;">{{ block.props.ctaText }}</a>
                  </nav>
                </header>

                <!-- 2. GFX Interactive Shader Hero -->
                <div v-else-if="block.type === 'GfxCyberHero'" class="card text-center py-5 position-relative w-100" style="min-height: 440px; overflow: hidden; display: flex; align-items: center; justify-content: center; border-radius: 1.2rem;">
                  <canvas :ref="el => setCanvasRef(el, block.id)" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0.88;"></canvas>
                  <div style="position: relative; z-index: 2; max-width: 740px; margin: 0 auto; padding: 2rem;">
                    <div class="mb-3 d-flex justify-content-center align-items-center gap-2">
                      <span class="badge bg-primary">DIRECT3D12 / WEBGL SHADER REFLECTION</span>
                      <span class="badge bg-success">60 FPS RUNTIME</span>
                    </div>
                    <h1 style="font-size: 2.6rem; font-weight: 900; margin-bottom: 1.2rem; background: linear-gradient(135deg, #fff 0%, var(--bs-primary) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                      {{ block.props.heading }}
                    </h1>
                    <p class="text-light mb-4" style="font-size: 1.15rem; opacity: 0.9; line-height: 1.6;">
                      {{ block.props.subheading }}
                    </p>
                    <div class="d-flex justify-content-center gap-3">
                      <button class="btn btn-primary px-4 py-2" style="font-size: 1.05rem;">{{ block.props.btnPrimaryText || 'Get Started' }}</button>
                      <button class="btn btn-outline-light px-4 py-2" style="font-size: 1.05rem;">{{ block.props.btnSecondaryText || 'Learn More' }}</button>
                    </div>
                  </div>
                </div>

                <!-- 3. Nuxt / Vue Feature Showcase Grid -->
                <div v-else-if="block.type === 'NuxtFeatureGrid'" class="w-100 py-3">
                  <h2 class="text-center mb-4" style="font-size: 2.1rem; font-weight: 800; color: var(--bs-primary);">
                    {{ block.props.sectionTitle }}
                  </h2>
                  <div class="row gap-3 justify-content-center">
                    <div v-for="(card, i) in (block.props.cards || [])" :key="i" class="col-12 col-md-4 card p-4" style="flex: 1 1 300px;">
                      <div class="d-flex justify-content-between align-items-center mb-3">
                        <span style="font-size: 2.3rem;">{{ card.icon || '🚀' }}</span>
                        <span v-if="card.badge" class="badge bg-primary">{{ card.badge }}</span>
                      </div>
                      <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 0.6rem; color: #fff;">{{ card.title }}</h3>
                      <p class="text-muted" style="font-size: 0.92rem; line-height: 1.6;">{{ card.desc }}</p>
                    </div>
                  </div>
                </div>

                <!-- 4. Svelte Pricing Table with Reactive Switcher -->
                <div v-else-if="block.type === 'SveltePricingTable'" class="w-100 py-3">
                  <div class="text-center mb-4">
                    <h2 style="font-size: 2.1rem; font-weight: 800; margin-bottom: 0.8rem; color: var(--bs-primary);">{{ block.props.sectionTitle }}</h2>
                    <span class="badge bg-success mb-3">{{ block.props.monthlyDiscount || 'Save 25%' }}</span>
                  </div>
                  <div class="row gap-4 justify-content-center">
                    <div v-for="(tier, i) in (block.props.tiers || [])" :key="i" class="col-12 col-md-4 card p-4" :style="{ flex: '1 1 310px', borderColor: tier.highlight ? 'var(--bs-primary)' : 'rgba(255,255,255,0.08)', borderWidth: tier.highlight ? '2px' : '1px', boxShadow: tier.highlight ? '0 0 30px rgba(0,220,130,0.2)' : 'none' }">
                      <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3 style="font-size: 1.35rem; font-weight: 800; margin: 0; color: #fff;">{{ tier.name }}</h3>
                        <span v-if="tier.highlight" class="badge bg-primary">RECOMMENDED</span>
                      </div>
                      <div style="font-size: 2.5rem; font-weight: 900; color: var(--bs-primary); margin-bottom: 0.5rem;">{{ tier.priceMonthly }}</div>
                      <p class="text-muted mb-4" style="min-height: 48px;">{{ tier.desc }}</p>
                      <ul style="list-style: none; padding: 0; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 0.7rem;">
                        <li v-for="feat in tier.features" :key="feat" class="d-flex align-items-center gap-2" style="font-size: 0.92rem;">
                          <span class="text-success">✓</span>
                          <span>{{ feat }}</span>
                        </li>
                      </ul>
                      <button :class="['btn w-100 py-2', tier.highlight ? 'btn-primary' : 'btn-outline-light']">Select Plan</button>
                    </div>
                  </div>
                </div>

                <!-- 5. Astro Hybrid Footer -->
                <footer v-else class="card text-center py-4 w-100">
                  <p class="text-muted mb-1">&copy; {{ block.props.copyrightYear || '2026' }} {{ block.props.companyName || 'WE-FAST' }}. All rights reserved.</p>
                  <p class="text-secondary" style="font-size: 0.85rem;">{{ block.props.tagline || 'Powered by WE-FAST Engine' }}</p>
                </footer>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Right Sidebar: Properties Inspector ("Lots of options!") -->
      <aside class="studio-sidebar-right p-3">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--bs-primary); margin-bottom: 1rem;">Properties Inspector</h3>

        <!-- Global Site Settings -->
        <div class="card p-3 mb-4" style="background: rgba(30,41,59,0.4);">
          <h4 style="font-size: 0.9rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.75rem;">Global Project Options</h4>
          <div class="mb-2">
            <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 3px;">Project Name</label>
            <input v-model="siteConfig.name" type="text" class="w-100 p-2" style="background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 0.85rem;" />
          </div>
          <div class="mb-2">
            <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 3px;">SEO Meta Description</label>
            <textarea v-model="siteConfig.description" rows="2" class="w-100 p-2" style="background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 0.8rem;"></textarea>
          </div>
        </div>

        <!-- Selected Block Settings -->
        <div v-if="selectedBlock" class="card p-3" style="background: rgba(30,41,59,0.4);">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span style="font-size: 0.95rem; font-weight: 800; color: #fff;">{{ selectedBlock.title }}</span>
            <span class="badge bg-primary">{{ selectedBlock.framework.toUpperCase() }}</span>
          </div>

          <!-- Bootstrap Layout Settings -->
          <h5 style="font-size: 0.82rem; font-weight: 700; color: #0dcaf0; margin-bottom: 0.6rem;">📐 Bootstrap Grid & Layout Options</h5>
          <div class="mb-3">
            <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 3px;">Column Span (Bootstrap Grid)</label>
            <select v-model="selectedBlock.colSpan" class="w-100 p-2" style="background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 0.85rem;">
              <option value="col-12">col-12 (100% Full Width)</option>
              <option value="col-lg-8">col-lg-8 (66% Two Thirds)</option>
              <option value="col-lg-6">col-lg-6 (50% Half Width)</option>
              <option value="col-lg-4">col-lg-4 (33% One Third)</option>
            </select>
          </div>
          <div class="mb-3">
            <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 3px;">Vertical Padding</label>
            <select v-model="selectedBlock.padding" class="w-100 p-2" style="background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 0.85rem;">
              <option value="py-1">py-1 (Compact 0.5rem)</option>
              <option value="py-2">py-2 (Small 1rem)</option>
              <option value="py-3">py-3 (Medium 1.5rem)</option>
              <option value="py-4">py-4 (Large 2.5rem)</option>
              <option value="py-5">py-5 (Hero 4rem)</option>
            </select>
          </div>
          <div class="mb-4">
            <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 3px;">Astro Island Hydration Mode</label>
            <select v-model="selectedBlock.islandHydration" class="w-100 p-2" style="background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 0.85rem;">
              <option value="client:load">client:load (Immediate Hydration)</option>
              <option value="client:visible">client:visible (Hydrate when in Viewport)</option>
              <option value="client:idle">client:idle (Hydrate when CPU Idle)</option>
              <option value="static">static (Zero-JS Static HTML)</option>
            </select>
          </div>

          <!-- GFX Shader Options (Only if framework === 'gfx') -->
          <div v-if="selectedBlock.framework === 'gfx' && selectedBlock.gfxOptions" class="card p-3 mb-4" style="background: rgba(15,23,42,0.85); border: 1px solid #0dcaf0;">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 style="font-size: 0.85rem; font-weight: 800; color: #0dcaf0; margin: 0;">🎨 GFX Shader Real-time Controls</h5>
              <button @click="reloadGfxKernel(selectedBlock!)" class="btn btn-primary py-1 px-2" style="font-size: 0.72rem; background: #0dcaf0; color: #000;" title="Simulate gfxKernelReloadAll()">
                ⚡ Reload Shaders
              </button>
            </div>
            <div class="mb-2">
              <label style="font-size: 0.72rem; color: #cbd5e1; display: block; margin-bottom: 2px;">Shader Type / Pipeline</label>
              <select v-model="selectedBlock.gfxOptions.shaderType" class="w-100 p-1" style="background: #03040c; border: 1px solid #0dcaf0; border-radius: 4px; color: #fff; font-size: 0.8rem;">
                <option value="cyber-tunnel">Raymarched Cyber-Tunnel (Neon Rings)</option>
                <option value="inline-raytracer">DXR-1.1 Inline Raytracer (Reflective Spheres)</option>
                <option value="neon-waves">Procedural Neon Waves (Liquid Sine)</option>
                <option value="particle-mesh">3D Interactive Particle Mesh Network</option>
              </select>
            </div>
            <div class="mb-2">
              <div class="d-flex justify-content-between">
                <label style="font-size: 0.72rem; color: #cbd5e1;">Time Speed: {{ selectedBlock.gfxOptions.speed }}x</label>
              </div>
              <input v-model.number="selectedBlock.gfxOptions.speed" type="range" min="0.2" max="3.0" step="0.1" class="w-100" />
            </div>
            <div class="mb-2">
              <div class="d-flex justify-content-between">
                <label style="font-size: 0.72rem; color: #cbd5e1;">Color Hue Speed: {{ selectedBlock.gfxOptions.colorSpeed }}x</label>
              </div>
              <input v-model.number="selectedBlock.gfxOptions.colorSpeed" type="range" min="0.2" max="4.0" step="0.2" class="w-100" />
            </div>
            <div class="mb-2">
              <div class="d-flex justify-content-between">
                <label style="font-size: 0.72rem; color: #cbd5e1;">Particle/Ring Density: {{ selectedBlock.gfxOptions.density }}</label>
              </div>
              <input v-model.number="selectedBlock.gfxOptions.density" type="range" min="6" max="45" step="1" class="w-100" />
            </div>
            <div>
              <div class="d-flex justify-content-between">
                <label style="font-size: 0.72rem; color: #cbd5e1;">Bloom Intensity: {{ selectedBlock.gfxOptions.bloom }}</label>
              </div>
              <input v-model.number="selectedBlock.gfxOptions.bloom" type="range" min="0.2" max="2.0" step="0.1" class="w-100" />
            </div>
          </div>

          <!-- Text / Content Controls -->
          <h5 style="font-size: 0.82rem; font-weight: 700; color: #0dcaf0; margin-bottom: 0.6rem;">📝 Content Parameters</h5>
          <div v-if="selectedBlock.props.heading !== undefined" class="mb-2">
            <label style="font-size: 0.75rem; color: #94a3b8; display: block;">Heading</label>
            <input v-model="selectedBlock.props.heading" type="text" class="w-100 p-2" style="background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 0.85rem;" />
          </div>
          <div v-if="selectedBlock.props.subheading !== undefined" class="mb-2">
            <label style="font-size: 0.75rem; color: #94a3b8; display: block;">Subheading</label>
            <textarea v-model="selectedBlock.props.subheading" rows="2" class="w-100 p-2" style="background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 0.82rem;"></textarea>
          </div>
          <div v-if="selectedBlock.props.sectionTitle !== undefined" class="mb-2">
            <label style="font-size: 0.75rem; color: #94a3b8; display: block;">Section Title</label>
            <input v-model="selectedBlock.props.sectionTitle" type="text" class="w-100 p-2" style="background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 0.85rem;" />
          </div>
          <div v-if="selectedBlock.props.btnPrimaryText !== undefined" class="mb-2">
            <label style="font-size: 0.75rem; color: #94a3b8; display: block;">Primary Button CTA</label>
            <input v-model="selectedBlock.props.btnPrimaryText" type="text" class="w-100 p-2" style="background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 0.85rem;" />
          </div>
          <div v-if="selectedBlock.props.btnSecondaryText !== undefined" class="mb-2">
            <label style="font-size: 0.75rem; color: #94a3b8; display: block;">Secondary Button CTA</label>
            <input v-model="selectedBlock.props.btnSecondaryText" type="text" class="w-100 p-2" style="background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 0.85rem;" />
          </div>
        </div>
        <div v-else class="text-center py-5 text-muted">
          <p style="font-size: 0.85rem;">Select any block on the canvas to inspect and modify its properties.</p>
        </div>
      </aside>
    </div>

    <!-- Export & Multi-Framework Code Modal -->
    <div v-if="showCodeModal" class="studio-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 3000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px);">
      <div class="card p-4" style="width: 90%; max-width: 980px; max-height: 90vh; display: flex; flex-direction: column; background: #0b0f19; border: 1px solid rgba(255,255,255,0.2);">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 style="font-size: 1.4rem; font-weight: 800; color: var(--bs-primary); margin: 0;">Multi-Framework Code Generator & Export</h3>
            <p class="text-muted" style="font-size: 0.85rem; margin: 0;">Export your generated site as clean production code in your preferred framework.</p>
          </div>
          <button @click="showCodeModal = false" class="btn btn-outline-light py-1 px-3" style="font-size: 1.1rem;">✕</button>
        </div>

        <!-- Target Tabs -->
        <div class="d-flex gap-2 mb-3 border-bottom pb-2" style="border-color: rgba(255,255,255,0.1) !important;">
          <button @click="codeTab = 'astro'" :class="['btn py-2 px-4', codeTab === 'astro' ? 'btn-primary' : 'btn-outline-light']" style="font-size: 0.9rem;">
            🏝️ Astro Hybrid Project
          </button>
          <button @click="codeTab = 'nuxt'" :class="['btn py-2 px-4', codeTab === 'nuxt' ? 'btn-primary' : 'btn-outline-light']" style="font-size: 0.9rem;">
            💚 Nuxt 4 / Vue 3
          </button>
          <button @click="codeTab = 'svelte'" :class="['btn py-2 px-4', codeTab === 'svelte' ? 'btn-primary' : 'btn-outline-light']" style="font-size: 0.9rem;">
            🔥 Svelte / SvelteKit
          </button>
          <button @click="codeTab = 'html'" :class="['btn py-2 px-4', codeTab === 'html' ? 'btn-primary' : 'btn-outline-light']" style="font-size: 0.9rem;">
            📐 Static HTML + Bootstrap + GFX
          </button>
        </div>

        <!-- Code Viewer Box -->
        <div style="flex: 1; overflow-y: auto; background: #03040c; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 1.2rem; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap; line-height: 1.5; color: #e2e8f0; margin-bottom: 1.2rem;">
{{ generatedCodeMap[codeTab] }}
        </div>

        <!-- Modal Actions -->
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-success" style="font-size: 0.9rem; font-weight: bold;">{{ copyFeedback }}</span>
          <div class="d-flex gap-3">
            <button @click="copyCurrentCode" class="btn btn-outline-light px-4 py-2">📋 Copy to Clipboard</button>
            <button @click="downloadSingleFileHtml" class="btn btn-primary px-4 py-2">⚡ Download Single-File HTML</button>
            <button @click="showCodeModal = false" class="btn btn-outline-light px-4 py-2">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
