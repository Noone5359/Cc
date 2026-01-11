import path from 'path';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

// Plugin to inject build timestamp into service worker
const injectBuildTime = (): Plugin => {
  return {
    name: 'inject-build-time',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js');
      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf-8');
        const buildTime = Date.now().toString();
        content = content.replace('__BUILD_TIME__', buildTime);
        fs.writeFileSync(swPath, content);
        console.log(`✓ Service worker updated with build time: ${buildTime}`);
      }
    }
  };
};

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: {
      port: 3000,
      host: 'localhost'
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://apis.google.com https://*.firebaseapp.com https://*.firebase.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com wss://*.firebaseio.com https://api.emailjs.com https://picsum.photos https://cdn.tailwindcss.com https://apis.google.com https://api.open-meteo.com https://www.google.com; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://www.google.com https://maps.google.com https://*.google.com; object-src 'none'; base-uri 'self'",
    }
  },
  plugins: [react(), injectBuildTime()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@types': path.resolve(__dirname, './src/types'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@config': path.resolve(__dirname, './src/config'),
      '@data': path.resolve(__dirname, './src/data'),
    }
  },
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          // Core vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Firebase core (always needed)
          'firebase-core': [
            'firebase/compat/app',
            'firebase/compat/auth',
            'firebase/compat/firestore'
          ],

          // Firebase optional (lazy loaded)
          'firebase-storage': ['firebase/compat/storage'],

          // Heavy libraries (lazy loaded in code)
          'image-compression': ['browser-image-compression'],

          // Icons
          'icons': ['lucide-react'],
        }
      }
    },
    // Reduce chunk size warning limit now that we're optimizing
    chunkSizeWarningLimit: 800,
    // Copy service worker to dist folder
    copyPublicDir: true,
    // Enable hidden sourcemaps for production debugging
    sourcemap: 'hidden'
  }
});
