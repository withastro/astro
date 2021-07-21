// TODO: Could this be put in a css file and easily injected into rendered page somehow?
export const hydrationOverlayStyles = `
              :root {
                --dev-tool-hydration-enabled: green;
                --dev-tool-hydration-disabled: gray;
              }

              .astro-devtools-badge {
                position: absolute;
                bottom: 2rem;
                left: 2rem;
                padding: 0.5rem;
                background: #374151;
                border-radius: 8px;
                cursor: pointer;
                user-select: none;
                box-shadow: 0px 2px 8px #111827;
                transition: all 300ms;
              }

              .astro-devtools-badge:hover {
                filter: brightness(1.25);
              }

              .astro-devtools-badge.astro-active {
                box-shadow: 0px 0px 0 2px #ff5d01 inset;
              }

              div[data-astro-hydration].astro-inspector { 
                position: relative;
              }

              div[data-astro-hydration=undefined] {
                position: relative;
              }

              div[data-astro-hydration=undefined].astro-notify::before,
              div[data-astro-hydration=undefined].astro-notify::after {
                position: absolute;
                opacity: 0;
                transition: opacity 500ms;
              }

              div[data-astro-hydration=undefined].astro-notify::before {
                content: "";
                width: 100%;
                height: 100%;
                background-image: linear-gradient(45deg, #374151 25%, transparent 25%, transparent 50%, #374151 50%, #374151 75%, transparent 75%, transparent 100%);
                background-size: 28.28px 28.28px;
              }

              div[data-astro-hydration=undefined].astro-notify::after { 
                background: #374151;
                padding: 0.5rem;
                content: "Static component. Use <"attr(data-astro-component-name)" client:load /> to hydrate.";
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
              }

              div[data-astro-hydration=undefined].astro-notify.show-notification::before { 
                opacity: 0.7;
              }

              div[data-astro-hydration=undefined].astro-notify.show-notification::after { 
                opacity: 1;
              }

              div[data-astro-hydration].astro-inspector::before {
                transform: translateY(-100%);
                content: "<"attr(data-astro-component-name)" />"; 
                position: absolute;
                background: var(--dev-tool-hydration-enabled);
                color: white;
                padding: 4px;
                border-radius: 4px 4px 0 0;
              }

              div[data-astro-hydration=undefined].astro-inspector::before { 
                background: var(--dev-tool-hydration-disabled);
              }

              div[data-astro-hydration].astro-inspector { border: 2px dashed var(--dev-tool-hydration-enabled); }
              div[data-astro-hydration=undefined].astro-inspector { border: 2px dashed var(--dev-tool-hydration-disabled) }
              `;

/**
 * Initialize devtools, use this instead of the automatic initalization
 * at bottom of this file?
 */
export function initDevTools() {
  addDevTools();
  addHydrationMissingClickHandler();
}

/**
 * Scan page for non-Astro components that are not being hydrated, and add
 * click event handler to give visual feedback that component is static.
 */
function addHydrationMissingClickHandler() {
  const allUnhydratedComponents = document.querySelectorAll('div[data-astro-hydration=undefined]');
  allUnhydratedComponents.forEach((componentElement) => {
    const componentName = (componentElement as HTMLElement).dataset.astroComponentName;
    componentElement.addEventListener('click', () => {
      componentElement.classList.add('show-notification');
      console.warn(
        `component < ${componentName} /> is being statically rendered. Use the client:* directives to hydrate it. Documentation: https://astro-docs-e7osusbql-pikapkg.vercel.app/core-concepts/component-hydration`
      );
      let showTimer = setTimeout(() => {
        componentElement.classList.remove('show-notification');
        clearTimeout(showTimer);
      }, 4000);
    });
  });
}

/**
 * Adds devtool element to the document body.
 */
function addDevTools() {
  const devTool = document.createElement('div');
  devTool.classList.add('astro-devtools-badge');
  devTool.innerHTML = '<img src="https://astro.build/favicon.svg" style="max-height: 45px;" />';

  const allNonAstroComponents = document.querySelectorAll('div[data-astro-hydration]');
  allNonAstroComponents.forEach((componentElement) => {
    componentElement.classList.add('astro-notify');
  });

  devTool.addEventListener('click', () => {
    devTool.classList.toggle('astro-active');

    allNonAstroComponents.forEach((componentElement) => {
      componentElement.classList.remove('show-notification');
      componentElement.classList.toggle('astro-notify');
      componentElement.classList.toggle('astro-inspector');
    });
  });

  document.body.appendChild(devTool);
}
