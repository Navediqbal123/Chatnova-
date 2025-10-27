import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // ✅ Fix 1: React SPA ke liye base './' zaroori hai
    base: './',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    // ✅ Fix 2: Environment variables ke liye safe define
    define: {
      'process.env': {
        API_KEY: JSON.stringify(env.GEMINI_API_KEY),
        GEMINI_API_KEY: JSON.stringify(env.GEMINI_API_KEY),
      },
    },

    // ✅ Fix 3: Alias correct rakha gaya hai
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    // ✅ Fix 4: Build output directory confirm (Render/Firebase ke liye)
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
