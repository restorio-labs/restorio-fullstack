import { StrictMode, type ReactElement } from "react";
import { createRoot } from "react-dom/client";

import { AppLayout } from "./layouts/AppLayout";
import { PageLayout } from "./layouts/PageLayout";
import { AppProviders } from "./wrappers/AppProviders";
import "./index.css";

const App = (): ReactElement => {
  return (
    <AppProviders>
      <AppLayout>
        <PageLayout title="Restorio Kitchen Panel">
          <div className="p-6">
            <p>Kitchen interface coming soon...</p>
          </div>
        </PageLayout>
      </AppLayout>
    </AppProviders>
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
