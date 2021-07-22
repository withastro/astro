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
    <nav class="sidebar-nav" aria-labelledby="sidebar-content">
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
          <li class={`header-link depth-2`}>
            <a
              href="https://github.com/snowpackjs/astro/issues/new/choose"
              target="_blank"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                data-prefix="fas"
                data-icon="bug"
                class="svg-inline--fa fa-bug fa-w-16"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                height="1em"
                width="1em"
              >
                <path
                  fill="currentColor"
                  d="M511.988 288.9c-.478 17.43-15.217 31.1-32.653 31.1H424v16c0 21.864-4.882 42.584-13.6 61.145l60.228 60.228c12.496 12.497 12.496 32.758 0 45.255-12.498 12.497-32.759 12.496-45.256 0l-54.736-54.736C345.886 467.965 314.351 480 280 480V236c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v244c-34.351 0-65.886-12.035-90.636-32.108l-54.736 54.736c-12.498 12.497-32.759 12.496-45.256 0-12.496-12.497-12.496-32.758 0-45.255l60.228-60.228C92.882 378.584 88 357.864 88 336v-16H32.666C15.23 320 .491 306.33.013 288.9-.484 270.816 14.028 256 32 256h56v-58.745l-46.628-46.628c-12.496-12.497-12.496-32.758 0-45.255 12.498-12.497 32.758-12.497 45.256 0L141.255 160h229.489l54.627-54.627c12.498-12.497 32.758-12.497 45.256 0 12.496 12.497 12.496 32.758 0 45.255L424 197.255V256h56c17.972 0 32.484 14.816 31.988 32.9zM257 0c-61.856 0-112 50.144-112 112h224C369 50.144 318.856 0 257 0z"
                ></path>
              </svg>
              <span>Report a bug</span>
            </a>
          </li>
          <li class={`header-link depth-2`}>
            <a href="https://astro.build/chat" target="_blank">
              <svg
                aria-hidden="true"
                focusable="false"
                data-prefix="fas"
                data-icon="comment-alt"
                class="svg-inline--fa fa-comment-alt fa-w-16"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                height="1em"
                width="1em"
              >
                <path
                  fill="currentColor"
                  d="M448 0H64C28.7 0 0 28.7 0 64v288c0 35.3 28.7 64 64 64h96v84c0 9.8 11.2 15.5 19.1 9.7L304 416h144c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64z"
                ></path>
              </svg>
              <span>Join the community</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default DocSidebar;
