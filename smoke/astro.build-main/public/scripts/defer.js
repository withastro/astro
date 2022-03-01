if (window.matchMedia('(hover: hover)').matches) {
    import('/scripts/konami.js').then(mod => mod.init());
}
