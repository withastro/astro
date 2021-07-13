import React from 'react';

export default ({ id, children }) => {
  return (
    <div id={id}>{children}</div>
  );
}