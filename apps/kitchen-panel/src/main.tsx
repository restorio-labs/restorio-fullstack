import React from "react";
import ReactDOM from "react-dom/client";

const App = (): JSX.Element => {
  return (
    <div>
      <h1>Restorio Kitchen Panel</h1>
      <p>Kitchen interface coming soon...</p>
    </div>
  );
};

const root = document.getElementById("root");

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

