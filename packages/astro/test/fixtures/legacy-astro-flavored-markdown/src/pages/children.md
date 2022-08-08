---
setup: import TextBlock from '../components/TextBlock'
---
{/* https://github.com/withastro/astro/issues/3319 */}

<TextBlock title="Hello world!" noPadding>
  <ul class="not-prose">
    <li>A</li>
    <li>B</li>
    <li>C</li>
  </ul>
</TextBlock>
