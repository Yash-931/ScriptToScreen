/**
 * Entry point for the React app. It mounts <App /> into #root and provides the
 * TanStack Query client that the API calls run through. Included from src/index.html.
 */

import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import "./index.css";

const queryClient = new QueryClient();

const elem = document.getElementById("root")!;

const app = (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

// Reuse the root across hot reloads. https://bun.com/docs/bundler/hot-reloading#import-meta-hot-data
(import.meta.hot.data.root ??= createRoot(elem)).render(app);
