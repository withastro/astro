import type { FunctionalComponent } from 'preact';
import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import EditOnGithub from './EditOnGithub';

const DocSidebar: FunctionalComponent<{ headers: any[]; editHref: string; }> = ({ headers = [], editHref }) => {
  const itemOffsets = useRef([]);
  const [activeId, setActiveId] = useState<string>(undefined);

  useEffect(() => {
    const getItemOffsets = () => {
      const titles = document.querySelectorAll('article :is(h2, h3, h4)');
      itemOffsets.current = Array.from(titles).map(title => ({
        id: title.id,
        topOffset: title.getBoundingClientRect().top + window.scrollY
      }));
    }

    const onScroll = () => {
      const itemIndex = itemOffsets.current.findIndex(item => item.topOffset > window.scrollY + (window.innerHeight / 3));
      if (itemIndex === 0) {
        setActiveId(undefined);
      } else if (itemIndex === -1) {
        setActiveId(itemOffsets.current[itemOffsets.current.length - 1].id)
      } else {
        setActiveId(itemOffsets.current[itemIndex - 1].id)
      }
    }

    getItemOffsets();
    window.addEventListener('resize', getItemOffsets);
    window.addEventListener('scroll', onScroll);

    return () => {
      window.removeEventListener('resize', getItemOffsets);
      window.removeEventListener('scroll', onScroll);
    }
  }, []);

  return (
    <nav>
      <div>
        <h4>Contents</h4>
        <ul>
          {headers.filter(({ depth }) => depth > 1 && depth < 5).map(header => <li class={`header-link depth-${header.depth} ${activeId === header.slug ? 'active' : ''}`.trim()}><a href={`#${header.slug}`}>{header.text}</a></li>)}
        </ul>
      </div>
      <div>
        <EditOnGithub href={editHref} />
      </div>
    </nav>    
  );
}

export default DocSidebar;
