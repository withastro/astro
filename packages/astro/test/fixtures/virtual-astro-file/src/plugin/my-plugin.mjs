

export default function myPlugin() {
  return {
    enforce: 'pre',
    name: 'virtual-astro-plugin',
    resolveId(id) {
      if (id === 'virtual.astro') return id;
    },
    load(id) {
      if (id === 'virtual.astro') {
        return `---
const works = true;
---
<h1 id="something">This is a virtual module id</h1>
<h2 id="works">{works}</h2>
`;
      }
    },
  };
}
