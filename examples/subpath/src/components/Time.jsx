import React from 'react';

export default function () {
  const date = new Date();
  const format = new Intl.DateTimeFormat('en-US');
  return <time>{format.format(date)}</time>;
}
