import type { FunctionalComponent } from 'preact';
import { h, Fragment } from 'preact';
import { useState, useEffect, useRef, StateUpdater } from 'preact/hooks';

// provided by https://www.emgoto.com/react-table-of-contents/
const useIntersectionObserver = () => {
  const [activeIds, setActiveIds] = useState([]);
  const headingElementsRef = useRef(
    new Map<string, IntersectionObserverEntry>()
  );
  useEffect(() => {
    const callback: IntersectionObserverCallback = (
      headings: IntersectionObserverEntry[]
    ) => {
      // For each of the headings, set 'heading id' = IntersectionObserverEntry in a Map.
      headingElementsRef.current = headings.reduce((map, headingElement) => {
        map.set(headingElement.target.children[0].id, headingElement);
        return map;
      }, headingElementsRef.current);

      // filter headingElementsRef.current for intersection sections and map it to an array of heading id's
      const visibleHeadingIds = Array.from(headingElementsRef.current.values())
        .filter((element) => element.isIntersecting)
        .map((element) => element.target.children[0].id);

      setActiveIds(visibleHeadingIds);
    };

    const observer = new IntersectionObserver(callback);

    const headingElements = Array.from(
      document.querySelectorAll('article :is(h1, h2, h3)')
    );

    headingElements.forEach((element) =>
      observer.observe(element.parentElement)
    );

    return () => observer.disconnect();
  }, [setActiveIds]);
  return activeIds;
};

const TableOfContents: FunctionalComponent<{ headers: any[] }> = ({
  headers = [],
}) => {
  const activeIds = useIntersectionObserver();

  return (
    <>
      <h2 class="heading">On this page</h2>
      <div>{JSON.stringify(activeIds)}</div>
      <ul>
        <li
          key="overview"
          class={`header-link depth-2 ${
            activeIds.includes('overview') ? 'active' : ''
          }`.trim()}
        >
          <a href="#overview">Overview</a>
        </li>
        {headers
          .filter(({ depth }) => depth > 1 && depth < 4)
          .map((header) => (
            <li
              key={header.slug}
              class={`header-link depth-${header.depth} ${
                activeIds.includes(header.slug) ? 'active' : ''
              }`.trim()}
            >
              <a href={`#${header.slug}`}>{header.text}</a>
            </li>
          ))}
      </ul>
    </>
  );
};

export default TableOfContents;
