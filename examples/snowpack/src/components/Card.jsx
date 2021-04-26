import { h } from 'preact';
import { format as formatDate, parseISO } from 'date-fns';
import './Card.css';

export default function Card({ item }) {
  return (
    <article class="card">
      <a
        href={item.url}
        style="text-decoration: none; color: initial; flex-grow: 1;"
      >
        {item.img ? (
          <img
            class="card-image card-image__sm"
            src={item.img}
            alt=""
            style={{ background: item.imgBackground || undefined }}
          />
        ) : (
          <div class="card-image card-image__sm"></div>
        )}
        <div class="card-text">
          <h3 class="card-title">{item.title}</h3>
          {item.date && (
            <time class="snow-toc-link">
              {formatDate(parseISO(item.date), 'MMMM	d, yyyy')}
            </time>
          )}
          {item.description && (
            <p style="margin: 0.5rem 0 0.25rem;">{item.description}</p>
          )}
        </div>
      </a>
    </article>
  );
}
