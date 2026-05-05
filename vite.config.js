import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Plugin: return real 404 (not SPA index.html) for MISSING files under
// /models/. Vite's connectHistoryFallback turns any unknown path into
// index.html, which makes web-llm JSON.parse() blow up on "<!doctype...".
// We post-process the response: if it ends up as text/html for a /models/
// path, rewrite to plain 404.
const noSpaFor = (prefixes) => ({
  name: 'no-spa-for-prefixes',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!prefixes.some((p) => req.url?.startsWith(p))) return next();
      const origWriteHead = res.writeHead.bind(res);
      const origEnd = res.end.bind(res);
      let buffered = '';
      let isHtmlFallback = false;
      res.writeHead = (status, headers) => {
        const hdrs = typeof headers === 'object' ? headers : (typeof status === 'object' ? status : {});
        const ct = hdrs?.['content-type'] || hdrs?.['Content-Type'] || res.getHeader('content-type') || '';
        if (typeof ct === 'string' && ct.includes('text/html')) {
          isHtmlFallback = true;
          // Replace headers with 404 plain text
          return origWriteHead(404, { 'content-type': 'text/plain' });
        }
        return origWriteHead(status, headers);
      };
      res.end = (chunk, ...rest) => {
        if (isHtmlFallback) {
          return origEnd(`404 not found: ${req.url}\n`);
        }
        return origEnd(chunk, ...rest);
      };
      next();
    });
  },
});

export default defineConfig({
  plugins: [
    noSpaFor(['/models/']),
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm'],
  },
});
