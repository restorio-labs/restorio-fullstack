import React from "react";
import ReactDOM from "react-dom/client";

const App = (): JSX.Element => {
  return (
    <div>
      <h1>Restorio Admin Panel</h1>
      <p>Admin dashboard coming soon...</p>
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

