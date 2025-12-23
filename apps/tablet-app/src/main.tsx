import React from "react";
import ReactDOM from "react-dom/client";

const App = (): JSX.Element => {
  return (
    <div>
      <h1>Restorio Tablet App</h1>
      <p>Tablet/kiosk interface coming soon...</p>
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
