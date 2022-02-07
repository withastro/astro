import glob from 'tiny-glob';
import fs from 'fs/promises';

let fontModuleContents = '';
let uniqueIconIds = new Set();
let foo = await glob('/Users/fks/Downloads/material-design-icons-master/src/**/24px.svg', {absolute: true, filesOnly: true});
foo = foo.filter(a => !a.endsWith('round/24px.svg') && !a.endsWith('sharp/24px.svg') && !a.endsWith('twotone/24px.svg'));
for (const iconPath of foo) {
  const iconId = `Icon` + iconPath
    .replace(/\/Users\/fks\/Downloads\/material-design-icons-master\/src\/.*?\/(.*?)\//, '$1')
    .replace('materialicons', '__')
    .replace('/24px.svg', '')
    .replace(/(^.)|(_[a-z0-9])|(__o)/g, v => v.toUpperCase())
    .replace(/_/g, '');
  const iconContents = (await fs.readFile(iconPath, {encoding: 'utf-8'}))
  .replace(/^\<svg.*?\>/, '')
  .replace(/\<\/svg\>$/, '');
  // console.log(iconContents);
  if (uniqueIconIds.has(iconId)) {
    console.log('CONFLICt', iconId);
    continue;
  }
  uniqueIconIds.add(iconId);
  fontModuleContents += `export const ${iconId} = ${JSON.stringify(iconContents)};\n`;
}

fontModuleContents += `\n`;

let brands = await glob('/Users/fks/Downloads/fontawesome-free-5.15.4-web/svgs/brands/*.svg', {absolute: true, filesOnly: true});
for (const iconPath of brands) {
  const iconId = `Logo` + iconPath
    .replace(/\/Users\/fks\/Downloads\/fontawesome\-free\-5\.15\.4\-web\/svgs\/brands\/(.*?)\.svg/, '$1')
    .replace(/(^.)|(\-[a-z0-9])/g, v => v.toUpperCase())
    .replace(/\-/g, '');
  const iconContents = (await fs.readFile(iconPath, {encoding: 'utf-8'}))
  .replace(/^\<svg.*?\>/, '')
  .replace(/\<\/svg\>$/, '');
  if (uniqueIconIds.has(iconId)) {
    console.log('CONFLICt', iconId);
    continue;
  }
  uniqueIconIds.add(iconId);
  fontModuleContents += `export const ${iconId} = ${JSON.stringify(iconContents)};\n`;
}


await fs.writeFile(`/Users/fks/Code/astro/packages/astro/icons/index.js`, fontModuleContents, {encoding: 'utf-8'});
