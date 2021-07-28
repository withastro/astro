/* jsxImportSource: react */
import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { DocSearchModal, useDocSearchKeyboardEvents } from '@docsearch/react'
import '@docsearch/css//dist/style.css';
import './Search.css';

function Hit({ hit, children }) {
  return (
    <a href={hit.url}>
      <a>{children}</a>
    </a>
  )
}

export function Search() {
  const [isOpen, setIsOpen] = useState(false)
  const searchButtonRef = useRef()
  const [initialQuery, setInitialQuery] = useState(null)

  const onOpen = useCallback(() => {
    setIsOpen(true)
  }, [setIsOpen])

  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const onInput = useCallback(
    (e) => {
      setIsOpen(true)
      setInitialQuery(e.key)
    },
    [setIsOpen, setInitialQuery]
  )

  useDocSearchKeyboardEvents({
    isOpen,
    onOpen,
    onClose,
    onInput,
    searchButtonRef,
  })

  return (
    <>
      <button
        type="button"
        ref={searchButtonRef}
        onClick={onOpen}
        className="search-input"
      >
        <svg
          width="24"
          height="24"
          fill="none"
        >
          <path
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>
          Search
        </span>
        <span
          className="search-hint"
        >
          <span className="sr-only">Press </span>
          <kbd>/</kbd>
          <span className="sr-only"> to search</span>
        </span>
      </button>
      {isOpen &&
        createPortal(
          <DocSearchModal
            initialQuery={initialQuery}
            initialScrollY={window.scrollY}
            searchParameters={{
              facetFilters: 'version:v2',
              distinct: 1,
            }}
            onClose={onClose}
            indexName="tailwindcss"
            apiKey="3df93446658cd9c4e314d4c02a052188"
            appId="BH4D9OD16A"
            hitComponent={Hit}
          />,
          document.body
        )}
    </>
  )
}

            // transformItems={(items) => {
            //   return items.map((item) => {
            //     // We transform the absolute URL into a relative URL to
            //     // leverage Next's preloading.
            //     const a = document.createElement('a')
            //     a.href = item.url

            //     const hash = a.hash === '#content-wrapper' ? '' : a.hash

            //     return {
            //       ...item,
            //       url: `${a.pathname}${hash}`,
            //     }
            //   })
            // }}