import { defineConfig, loadEnv } from 'vite'
import { copyFileSync, mkdirSync } from 'node:fs'

// index.html uses classic scripts and CDN libraries, so Vite must not rewrite it.
// This plugin copies it into dist untouched after the bundle is written.
const copyIndex = () => ({
  name: 'copy-index-html',
  closeBundle() {
    mkdirSync('dist', { recursive: true })
    copyFileSync('index.html', 'dist/index.html')
  },
})

export default defineConfig(({ mode }) => {
  // WC_PROJECT_ID comes from the Cloudflare environment variable (or a local .env file).
  const env = loadEnv(mode, process.cwd(), '')
  const projectId = env.WC_PROJECT_ID || process.env.WC_PROJECT_ID || ''
  if (!projectId) {
    console.warn('WARNING: WC_PROJECT_ID is not set. The Trust Wallet Bitcoin connection will not work until you set it.')
  }

  return {
    plugins: [copyIndex()],
    esbuild: { jsx: 'automatic' },
    define: {
      WC_PROJECT_ID: JSON.stringify(projectId),
      'process.env.NODE_ENV': '"production"',
      global: 'globalThis',
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'es2020',
      cssCodeSplit: false,
      // Bundle trust-btc.jsx into one script that index.html loads as trust-btc.js
      lib: {
        entry: 'trust-btc.jsx',
        name: 'TrustBtc',
        formats: ['iife'],
        fileName: () => 'trust-btc.js',
      },
      rollupOptions: {
        output: {
          // Fixed name for the SDK stylesheet so index.html can link trust-btc.css
          assetFileNames: (asset) => {
            const name = asset.names?.[0] || asset.name || ''
            return name.endsWith('.css') ? 'trust-btc.css' : '[name][extname]'
          },
        },
      },
    },
  }
})
