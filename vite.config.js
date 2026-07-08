import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    middlewareMode: false,
    fs: {
      strict: false,
    },
    historyApiFallback: true,
  },
  preview: {
    historyApiFallback: true,
  },
  build: {
    rollupOptions: {
      input: {
        main:        resolve(__dirname, 'index.html'),
        catalogo:    resolve(__dirname, 'catalogo.html'),
        admin:       resolve(__dirname, 'admin.html'),
        adminLogin:  resolve(__dirname, 'admin-login.html'),
        adminIndex:  resolve(__dirname, 'admin-index.html'),
      },
    },
  },
  plugins: [
    {
      name: 'admin-routes',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next();

          if (req.url === '/admin' || req.url === '/admin/') {
            req.url = '/admin-login.html';
            return next();
          }

          if (req.url === '/admin-login' || req.url === '/admin-login/') {
            req.url = '/admin-login.html';
            return next();
          }

          if (req.url === '/admin/painel' || req.url === '/admin/painel/') {
            req.url = '/admin.html';
            return next();
          }

          next();
        });
      },
    },
  ],
})
