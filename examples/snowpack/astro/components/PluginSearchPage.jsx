import { h, Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import * as Styles from './PluginSearchPage.module.css';

async function searchPlugins(val) {
  const params3 = new URLSearchParams([
    ['q', 'snowpack plugin ' + (val || '')],
    ['count', '100'],
  ]);
  const res = await fetch(
    `https://api.skypack.dev/v1/search?${params3.toString()}`,
  );
  const jsonres = await res.json();
  return jsonres.results;
}

function Card({ result }) {
  const updatedAtFormatted = Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(Date.parse(result.updatedAt));
  return (
    <li class={Styles.Card}>
      <img class={Styles.Icon__Plugin} src="/img/plug-light.svg" />
      <header class={Styles.CardHeader}>
        <h3 class={Styles.CardName}>
          <a href="https://www.npmjs.com/package/{result.name}" target="_blank">
            <span itemprop="name">{result.name}</span>
          </a>
        </h3>
      </header>
      <p class={Styles.CardDesc} itemprop="description">
        {result.description.split('. ')[0]}
      </p>
      <p class={Styles.CardSubtitle}>
        Updated
        <time class="" datetime={result.updatedAt}>
          {updatedAtFormatted}
        </time>
      </p>
    </li>
  );
}

export default function PluginSearchPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const [results, setResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q'));
  useEffect(() => {
    (async () => {
      setResults(await searchPlugins(searchParams.get('q')));
    })();
  }, []);

  async function onFormSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const formula = form.get('q');
    // document.getElementById('loading-message').style.display = 'block';
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('q', formula);
    window.history.pushState(null, null, '?' + searchParams.toString());
    setSearchQuery(formula);
    setResults(await searchPlugins(formula));
    return false;
  }
  //   if (document.getElementById('loading-message')) {
  //     document.getElementById('loading-message').style.display = 'none';
  //   }

  return (
    <>
      <form
        name="myform"
        id="myform"
        class={Styles.Form}
        action="https://www.npmjs.com/search"
        method="GET"
        onSubmit={onFormSubmit}
      >
        <input
          type="search"
          name="q"
          defaultValue={searchQuery}
          placeholder="search Sass, sitemaps, image optimization..."
          class={Styles.Input}
        />
        <button type="submit" class={Styles.Submit}>
          Search
        </button>
      </form>
      <div class={Styles.Count} id="total-result-count">
        {!searchQuery &&
          results &&
          results.length > 50 &&
          `${results.length}+ plugins available!`}
      </div>
      <section id="search-results" class={Styles.Results}>
        {!results && (
          <div id="loading-message" class={Styles.Loading}>
            Loading...
          </div>
        )}
        {results && results.length === 0 && (
          <ul class={Styles.CardList}>
            <li style="margin: 1rem; text-align: center;">No results found.</li>
          </ul>
        )}
        {results && results.length > 0 && (
          <ul class={Styles.CardList}>
            {results.map((r) => (
              <Card result={r} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
