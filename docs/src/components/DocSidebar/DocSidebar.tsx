import type { FunctionalComponent } from 'preact';
import { h } from 'preact';
import More from './More';
import TableOfContents from './TableOfContents';

export const DocSidebar: FunctionalComponent<{
  headers: any[];
  editHref: string;
}> = ({ headers = [], editHref }) => {
  return (
    <nav class="sidebar-nav" aria-labelledby="sidebar-content">
      <div class="sidebar-nav-inner">
        <TableOfContents headers={headers} />
        <More editHref={editHref} />
      </div>
    </nav>
  );
};

export default DocSidebar;
export { default as More } from './More';
export { default as TableOfContents } from './TableOfContents';
