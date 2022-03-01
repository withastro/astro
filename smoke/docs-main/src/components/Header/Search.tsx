/* jsxImportSource: react */
import { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as docsearch from '@docsearch/react';
import '@docsearch/css/dist/style.css';
import './Search.css';

const { DocSearchModal, useDocSearchKeyboardEvents } = (docsearch as unknown as { default: typeof docsearch }).default || docsearch;

export default function Search(props) {
	const [isOpen, setIsOpen] = useState(false);
	const searchButtonRef = useRef();
	const [initialQuery, setInitialQuery] = useState(null);
	const { lang = 'en' } = props;

	const onOpen = useCallback(() => {
		setIsOpen(true);
	}, [setIsOpen]);

	const onClose = useCallback(() => {
		setIsOpen(false);
	}, [setIsOpen]);

	const onInput = useCallback(
		(e) => {
			setIsOpen(true);
			setInitialQuery(e.key);
		},
		[setIsOpen, setInitialQuery]
	);

	useDocSearchKeyboardEvents({
		isOpen,
		onOpen,
		onClose,
		onInput,
		searchButtonRef,
	});

	return (
		<>
			<button type="button" ref={searchButtonRef} onClick={onOpen} className="search-input">
				<svg width="24" height="24" fill="none">
					<path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
				<span className="search-placeholder">Search</span>
				<span className="search-hint">
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
						onClose={onClose}
						indexName="astro"
						appId='7AFBU8EPJU'
						apiKey="4440670147c44d744fd8da35ff652518"
						searchParameters={{ facetFilters: [[`lang:${lang}`]] }}
						getMissingResultsUrl={({ query }) => `https://github.com/withastro/docs/issues/new?title=Missing+results+for+query+%22${encodeURIComponent(query)}%22`}
						transformItems={(items) => {
							return items.map((item) => {
								// We transform the absolute URL into a relative URL to
								// work better on localhost, preview URLS.
								const a = document.createElement('a');
								a.href = item.url;
								const hash = a.hash === '#overview' ? '' : a.hash;
								return {
									...item,
									url: `${a.pathname}${hash}`,
								};
							});
						}}
					/>,
					document.body
				)}
		</>
	);
}
