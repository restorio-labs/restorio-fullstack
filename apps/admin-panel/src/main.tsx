import React from "react";
import { createRoot } from "react-dom/client";

const App = (): React.ReactElement => {
  return (
    <div>
      <h1>Restorio Admin Panel</h1>
      <p>Admin dashboard coming soon...</p>
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
