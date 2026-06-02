import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:        resolve(__dirname, 'index.html'),
        admin:       resolve(__dirname, 'admin.html'),
        adminLogin:  resolve(__dirname, 'admin-login.html'),
        adminIndex:  resolve(__dirname, 'admin-index.html'),
      },
    },
  },
})
