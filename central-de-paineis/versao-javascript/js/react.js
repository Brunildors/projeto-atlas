const { React, ReactDOM } = window;

if (!React || !ReactDOM) {
  throw new Error("React não carregou: confira as tags <script> do CDN no index.html");
}

export const h = React.createElement;
export const { Fragment, StrictMode, useState, useEffect, useMemo, useRef } = React;
export const { createRoot } = ReactDOM;
