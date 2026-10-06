import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    // Single-page app: every path serves the same HTML shell.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🎬 ScriptToScreen frontend running at ${server.url}`);
