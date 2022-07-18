---
'astro': patch
---

Fixed many long-standing issues with `astro check`

- Fixed it not working on Windows at all
- Fixed red squiggles not showing in the proper place in certain contexts, notably with strings using non-latin characters
- Fixed IDE links pointing to the wrong line number and character
- Fixed line numbers being off by one
- Fixed IDE links not working when the project wasn't at the root of the folder

Additionally added some features:

- Added more pretty colors
- Fixed it not working at all on Windows
- Warnings and hints are now printed alongside errors
- Surrounding lines are now shown when relevant (aka not empty)
