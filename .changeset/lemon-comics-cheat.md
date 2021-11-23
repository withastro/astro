---
'astro': patch
---

Update compiler with the following patches:
- Fix components supporting only one style or script
- Fix regression where leading `<style>` elements could break generated tags
- Fix case-sensitivity of void elements
- Fix expressions not working within SVG elements
- Fix panic when preprocessed style is empty
