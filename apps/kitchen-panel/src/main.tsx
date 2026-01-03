import React from "react";
import { createRoot } from "react-dom/client";

const App = (): React.ReactElement => {
  return (
    <div>
      <h1>Restorio Kitchen Panel</h1>
      <p>Kitchen interface coming soon...</p>
    </div>
  );
};

const root = document.getElementById("root");

if (root) {
  const reactRoot = createRoot(root);

  reactRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
