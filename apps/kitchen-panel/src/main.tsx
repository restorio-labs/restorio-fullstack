import { StrictMode, type ReactElement } from "react";
import { createRoot } from "react-dom/client";

const App = (): ReactElement => {
  return (
    <div>
      <h1>Restorio Kitchen Panel</h1>
      <p>Kitchen interface coming soon...</p>
    </div>
  );
};

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

const reactRoot = createRoot(root);

reactRoot.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
