import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'privacy-route-rewrite',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/privacy.html' || req.url === '/privacy') {
            res.writeHead(302, { Location: '/kebijakanprivacy' });
            res.end();
            return;
          }
          if (req.url === '/kebijakanprivacy' || req.url === '/kebijakanprivacy/') {
            const privacyPath = resolve(__dirname, 'public/kebijakanprivacy/index.html');
            if (fs.existsSync(privacyPath)) {
              res.setHeader('Content-Type', 'text/html');
              res.end(fs.readFileSync(privacyPath));
              return;
            }
          }
          next();
        });
      },
      closeBundle() {
        // Bersihkan file demo/dev-only dari folder dist produksi tanpa menyentuh aset aplikasi
        const devOnlyDistFiles = [
          resolve(__dirname, 'dist/navbar-showcase.html'),
          resolve(__dirname, 'dist/apple-reference.jpg'),
        ];
        for (const filePath of devOnlyDistFiles) {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch {
            // Ignore cleanup error
          }
        }
      }
    }
  ],
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        kebijakanprivacy: resolve(__dirname, 'public/kebijakanprivacy/index.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('@capacitor')) {
              return 'vendor-capacitor';
            }
            if (id.includes('react')) {
              return 'vendor-react';
            }
            return 'vendor-core';
          }
        }
      }
    }
  }
});
