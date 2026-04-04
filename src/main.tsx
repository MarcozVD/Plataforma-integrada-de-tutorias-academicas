import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (typeof resource === 'string') {
    if (resource.startsWith('/auth') || resource.startsWith('/api')) {
      resource = `http://147.15.137.230:8000${resource}`;
    }
  }
  return originalFetch(resource, config);
};
createRoot(document.getElementById("root")!).render(<App />);
