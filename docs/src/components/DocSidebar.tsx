import type { FunctionalComponent } from 'preact';
import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import EditOnGithub from './EditOnGithub';

const DocSidebar: FunctionalComponent<{ headers: any[]; editHref: string }> = ({
  headers = [],
  editHref,
}) => {
  const itemOffsets = useRef([]);
  const [activeId, setActiveId] = useState<string>(undefined);

  useEffect(() => {
    const getItemOffsets = () => {
      const titles = document.querySelectorAll('article :is(h1, h2, h3, h4)');
      itemOffsets.current = Array.from(titles).map((title) => ({
        id: title.id,
        topOffset: title.getBoundingClientRect().top + window.scrollY,
      }));
    };

    getItemOffsets();
    window.addEventListener('resize', getItemOffsets);

    return () => {
      window.removeEventListener('resize', getItemOffsets);
    };
  }, []);

  return (
    <nav class="sidebar-nav">
      <div class="sidebar-nav-inner">
        <h2 class="heading">On this page</h2>
        <ul>
          <li
            class={`header-link depth-2 ${
              activeId === 'overview' ? 'active' : ''
            }`.trim()}
          >
            <a href="#overview">Overview</a>
          </li>
          {headers
            .filter(({ depth }) => depth > 1 && depth < 4)
            .map((header) => (
              <li
                class={`header-link depth-${header.depth} ${
                  activeId === header.slug ? 'active' : ''
                }`.trim()}
              >
                <a href={`#${header.slug}`}>{header.text}</a>
              </li>
            ))}
        </ul>
        <h2 class="heading">More</h2>
        <ul>
          <li class={`header-link depth-2`}>
            <EditOnGithub href={editHref} />
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default DocSidebar;
