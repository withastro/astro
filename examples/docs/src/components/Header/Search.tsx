/* jsxImportSource: react */
import { useState, useCallback, useRef } from 'react';
import * as CONFIG from '../../config';
import '@docsearch/css/dist/style.css';
import './Search.css';

// @ts-ignore
import * as docSearchReact from '@docsearch/react';
// @ts-ignore
import { createPortal } from 'react-dom';

export default function Search() {
	const DocSearchModal = docSearchReact.DocSearchModal || docSearchReact.default.DocSearchModal;

	const useDocSearchKeyboardEvents =
		docSearchReact.useDocSearchKeyboardEvents || docSearchReact.default.useDocSearchKeyboardEvents;

	const [isOpen, setIsOpen] = useState(false);
	const searchButtonRef = useRef();
	const [initialQuery, setInitialQuery] = useState(null);

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
					<path
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>

				<span>Search</span>

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
						indexName={(CONFIG as any).ALGOLIA.indexName}
						appId={(CONFIG as any).ALGOLIA.appId}
						apiKey={(CONFIG as any).ALGOLIA.apiKey}
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
