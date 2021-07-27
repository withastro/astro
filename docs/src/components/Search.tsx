import type { FunctionalComponent } from 'preact';
import { h, Fragment } from 'preact';
import Styles from './Search.module.css';

const Search: FunctionalComponent = () => {
  return (
    <form
      action="https://duckduckgo.com/"
      method="get"
      class="search"
      target="_blank"
      id="docs-search"
    >
      <div class={Styles.flex}>
        <div>
          <label for="search-term" class="sr-only">
            Search Terms
          </label>
          <input
            type="search"
            name="q"
            id="search-term"
            class={Styles['search-txt']}
            placeholder="Search via DuckDuckGo"
            autocomplete="off"
            required="true"
          />
          <input
            aria-hidden="true"
            name="sites"
            value="docs.astro.build"
            hidden=""
          />
        </div>
        <div>
          <button type="submit">Search</button>
        </div>
      </div>
    </form>
  );
};

export default Search;
