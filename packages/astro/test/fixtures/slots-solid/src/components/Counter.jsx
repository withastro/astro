import React, { useState } from 'react';

export default function Counter({ children, count: initialCount, case: id }) {
  return (
    <>
      <div className="counter">
        <pre>{0}</pre>
      </div>
      <div id={id} className="counter-message">
        {children || <h1>Fallback</h1>}
      </div>
    </>
  );
}
